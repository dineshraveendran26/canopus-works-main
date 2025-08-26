import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface SubtaskAssignment {
  id: string
  subtask_id: string
  user_id: string
  assigned_at: string
  assigned_by?: string
  role: string
  user?: {
    email: string
    full_name: string
  }
}

export interface EffectiveSubtaskAssignee {
  user_id: string
  email: string
  full_name: string
  assigned_at: string
  role: string
  assignment_type: 'explicit' | 'inherited'
}

export function useSubtaskAssignments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get explicit assignees for a subtask
  const getSubtaskAssignees = useCallback(async (subtaskId: string): Promise<SubtaskAssignment[]> => {
    if (!user) {
      setError('User not authenticated')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('subtask_assignments')
        .select(`
          id,
          subtask_id,
          user_id,
          assigned_at,
          assigned_by,
          role
        `)
        .eq('subtask_id', subtaskId)

      if (fetchError) {
        throw new Error(`Failed to fetch subtask assignees: ${fetchError.message}`)
      }

      // Map the data to match our interface
      return (data || []).map(item => ({
        id: item.id,
        subtask_id: item.subtask_id,
        user_id: item.user_id,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by,
        role: item.role,
        user: {
          email: '', // Will be populated separately if needed
          full_name: ''
        }
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subtask assignees'
      setError(errorMessage)
      console.error('Error fetching subtask assignees:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get effective assignees (explicit + inherited from parent task)
  const getEffectiveSubtaskAssignees = useCallback(async (subtaskId: string): Promise<EffectiveSubtaskAssignee[]> => {
    if (!user) {
      setError('User not authenticated')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      // Use the database function to get effective assignees
      const { data, error: fetchError } = await supabase
        .rpc('get_effective_subtask_assignees', { p_subtask_id: subtaskId })

      if (fetchError) {
        throw new Error(`Failed to fetch effective subtask assignees: ${fetchError.message}`)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch effective subtask assignees'
      setError(errorMessage)
      console.error('Error fetching effective subtask assignees:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Assign users to a subtask (replaces existing assignments)
  const assignUsersToSubtask = useCallback(async (
    subtaskId: string,
    userIds: string[],
    role: string = 'assignee'
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Use the database function for assignment
      const { error: assignError } = await supabase
        .rpc('assign_users_to_subtask', {
          p_subtask_id: subtaskId,
          p_user_ids: userIds,
          p_assigned_by: user.id
        })

      if (assignError) {
        throw new Error(`Failed to assign users to subtask: ${assignError.message}`)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign users to subtask'
      setError(errorMessage)
      console.error('Error assigning users to subtask:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update subtask assignments (calculate differences and apply)
  const updateSubtaskAssignments = useCallback(async (
    subtaskId: string,
    newUserIds: string[],
    role: string = 'assignee'
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Get current assignments
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('subtask_assignments')
        .select('user_id')
        .eq('subtask_id', subtaskId)

      if (fetchError) {
        throw new Error(`Failed to fetch current assignments: ${fetchError.message}`)
      }

      const currentAssigneeIds = currentAssignments?.map(a => a.user_id) || []
      
      // Find assignees to add
      const assigneesToAdd = newUserIds.filter(id => !currentAssigneeIds.includes(id))
      
      // Find assignees to remove
      const assigneesToRemove = currentAssigneeIds.filter(id => !newUserIds.includes(id))

      // Remove old assignments
      if (assigneesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('subtask_assignments')
          .delete()
          .eq('subtask_id', subtaskId)
          .in('user_id', assigneesToRemove)

        if (deleteError) {
          console.warn('Failed to remove old assignments:', deleteError)
        }
      }

      // Add new assignments
      if (assigneesToAdd.length > 0) {
        const newAssignments = assigneesToAdd.map(userId => ({
          subtask_id: subtaskId,
          user_id: userId,
          assigned_at: new Date().toISOString(),
          assigned_by: user.id,
          role
        }))

        const { error: insertError } = await supabase
          .from('subtask_assignments')
          .insert(newAssignments)

        if (insertError) {
          throw new Error(`Failed to add new assignments: ${insertError.message}`)
        }
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subtask assignments'
      setError(errorMessage)
      console.error('Error updating subtask assignments:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Remove a specific user from a subtask
  const removeUserFromSubtask = useCallback(async (
    subtaskId: string,
    userId: string
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('subtask_assignments')
        .delete()
        .eq('subtask_id', subtaskId)
        .eq('user_id', userId)

      if (deleteError) {
        throw new Error(`Failed to remove user from subtask: ${deleteError.message}`)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove user from subtask'
      setError(errorMessage)
      console.error('Error removing user from subtask:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Clear all assignments for a subtask
  const clearSubtaskAssignments = useCallback(async (subtaskId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('subtask_assignments')
        .delete()
        .eq('subtask_id', subtaskId)

      if (deleteError) {
        throw new Error(`Failed to clear subtask assignments: ${deleteError.message}`)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear subtask assignments'
      setError(errorMessage)
      console.error('Error clearing subtask assignments:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Bulk assign multiple subtasks to a user
  const bulkAssignSubtasksToUser = useCallback(async (
    subtaskIds: string[],
    userId: string,
    role: string = 'assignee'
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: bulkError } = await supabase
        .rpc('bulk_assign_subtasks_to_user', {
          p_subtask_ids: subtaskIds,
          p_user_id: userId,
          p_assigned_by: user.id
        })

      if (bulkError) {
        throw new Error(`Failed to bulk assign subtasks: ${bulkError.message}`)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk assign subtasks'
      setError(errorMessage)
      console.error('Error bulk assigning subtasks:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Sync subtask assignments with parent task assignments
  const syncSubtaskAssignmentsWithTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: syncError } = await supabase
        .rpc('sync_subtask_assignments_with_task', { p_task_id: taskId })

      if (syncError) {
        throw new Error(`Failed to sync subtask assignments: ${syncError.message}`)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync subtask assignments'
      setError(errorMessage)
      console.error('Error syncing subtask assignments:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get all subtasks for a user
  const getSubtasksForUser = useCallback(async (userId: string): Promise<string[]> => {
    if (!user) {
      setError('User not authenticated')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('subtask_assignments')
        .select('subtask_id')
        .eq('user_id', userId)

      if (fetchError) {
        throw new Error(`Failed to fetch user subtasks: ${fetchError.message}`)
      }

      return data?.map(a => a.subtask_id) || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user subtasks'
      setError(errorMessage)
      console.error('Error fetching user subtasks:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    loading,
    error,
    getSubtaskAssignees,
    getEffectiveSubtaskAssignees,
    assignUsersToSubtask,
    updateSubtaskAssignments,
    removeUserFromSubtask,
    clearSubtaskAssignments,
    bulkAssignSubtasksToUser,
    syncSubtaskAssignmentsWithTask,
    getSubtasksForUser,
    clearError: () => setError(null)
  }
} 