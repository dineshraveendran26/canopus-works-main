import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface TaskAssignment {
  id: string
  task_id: string
  user_id: string
  assigned_at: string
  assigned_by?: string
  role: string
}

export interface CreateTaskAssignmentData {
  task_id: string
  user_id: string
  assigned_by?: string
  role?: string
}

export function useTaskAssignments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all assignments for a specific task
  const getTaskAssignments = useCallback(async (taskId: string): Promise<string[]> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('task_assignments')
        .select('user_id')
        .eq('task_id', taskId)

      if (fetchError) {
        console.error('Error fetching task assignments:', fetchError)
        setError(fetchError.message)
        return []
      }

      return data?.map(assignment => assignment.user_id) || []
    } catch (err) {
      console.error('Error in getTaskAssignments:', err)
      setError('Failed to fetch task assignments')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Assign users to a task
  const assignUsersToTask = useCallback(async (
    taskId: string, 
    userIds: string[], 
    role: string = 'assignee'
  ): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to assign tasks')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Create assignments for all users
      const assignments = userIds.map(userId => ({
        task_id: taskId,
        user_id: userId,
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
        role
      }))

      const { error: insertError } = await supabase
        .from('task_assignments')
        .insert(assignments)

      if (insertError) {
        console.error('Error assigning users to task:', insertError)
        setError(insertError.message)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in assignUsersToTask:', err)
      setError('Failed to assign users to task')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update task assignments (replace all current assignments with new ones)
  const updateTaskAssignments = useCallback(async (
    taskId: string, 
    newUserIds: string[], 
    role: string = 'assignee'
  ): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to update task assignments')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Get current assignments
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('task_assignments')
        .select('user_id')
        .eq('task_id', taskId)

      if (fetchError) {
        console.error('Error fetching current assignments:', fetchError)
        setError(fetchError.message)
        return false
      }

      const currentAssigneeIds = currentAssignments?.map(a => a.user_id) || []

      // Find assignees to add
      const assigneesToAdd = newUserIds.filter(id => !currentAssigneeIds.includes(id))
      
      // Find assignees to remove
      const assigneesToRemove = currentAssigneeIds.filter(id => !newUserIds.includes(id))

      // Remove old assignments
      if (assigneesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', taskId)
          .in('user_id', assigneesToRemove)

        if (deleteError) {
          console.error('Error removing old assignments:', deleteError)
          setError(deleteError.message)
          return false
        }
      }

      // Add new assignments
      if (assigneesToAdd.length > 0) {
        const newAssignments = assigneesToAdd.map(userId => ({
          task_id: taskId,
          user_id: userId,
          assigned_at: new Date().toISOString(),
          assigned_by: user.id,
          role
        }))

        const { error: insertError } = await supabase
          .from('task_assignments')
          .insert(newAssignments)

        if (insertError) {
          console.error('Error adding new assignments:', insertError)
          setError(insertError.message)
          return false
        }
      }

      return true
    } catch (err) {
      console.error('Error in updateTaskAssignments:', err)
      setError('Failed to update task assignments')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Remove a specific user from a task
  const removeUserFromTask = useCallback(async (taskId: string, userId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error removing user from task:', deleteError)
        setError(deleteError.message)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in removeUserFromTask:', err)
      setError('Failed to remove user from task')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear all assignments for a task
  const clearTaskAssignments = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)

      if (deleteError) {
        console.error('Error clearing task assignments:', deleteError)
        setError(deleteError.message)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in clearTaskAssignments:', err)
      setError('Failed to clear task assignments')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get all tasks assigned to a specific user
  const getTasksForUser = useCallback(async (userId: string): Promise<string[]> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('user_id', userId)

      if (fetchError) {
        console.error('Error fetching tasks for user:', fetchError)
        setError(fetchError.message)
        return []
      }

      return data?.map(assignment => assignment.task_id) || []
    } catch (err) {
      console.error('Error in getTasksForUser:', err)
      setError('Failed to fetch tasks for user')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    getTaskAssignments,
    assignUsersToTask,
    updateTaskAssignments,
    removeUserFromTask,
    clearTaskAssignments,
    getTasksForUser,
    clearError,
  }
} 