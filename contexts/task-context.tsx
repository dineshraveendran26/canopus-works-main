"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useTasks, type Task, type Subtask, type Comment } from "@/hooks/use-tasks"
import { useAuth } from "@/contexts/auth-context"

interface FilterType {
  type: "all" | "completed" | "attention"
}

interface TaskContextType {
  tasks: Task[]
  filter: FilterType
  searchQuery: string
  addTask: (task: Omit<Task, "id">) => Promise<Task | null>
  createTaskWithAssignees: (task: Omit<Task, "id">) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => void
  getTasksByStatus: (status: string) => Task[]
  setFilter: (filter: FilterType) => void
  setSearchQuery: (query: string) => void
  getFilteredTasks: () => Task[]
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  console.log('🔄 TaskProvider START - Initializing context')
  
  // Wait for user authentication before initializing useTasks
  const { user, loading: authLoading } = useAuth()
  console.log('🔄 TaskProvider - Auth state:', { user: !!user, userId: user?.id, authLoading })
  
  // Always call useTasks to maintain hook order consistency
  const {
    tasks,
    addTask: supabaseAddTask,
    createTaskWithAssignees: supabaseCreateTaskWithAssignees,
    updateTask: supabaseUpdateTask,
    deleteTask: supabaseDeleteTask,
    getTasksByStatus,
  } = useTasks()
  
  console.log('🔄 TaskProvider - useTasks result:', {
    tasksCount: tasks?.length || 0,
    hasAddTask: !!supabaseAddTask,
    hasUpdateTask: !!supabaseUpdateTask,
    hasDeleteTask: !!supabaseDeleteTask
  })

  const [filter, setFilter] = useState<FilterType>({ type: "all" })
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Wrapper functions to maintain the same interface
  const addTask = async (taskData: Omit<Task, "id">) => {
    console.log('🔄 TaskContext addTask START - Called with:', taskData)
    console.log('🔄 TaskContext addTask - taskData type:', typeof taskData)
    console.log('🔄 TaskContext addTask - taskData keys:', Object.keys(taskData))
    console.log('🔄 TaskContext addTask - supabaseAddTask function:', supabaseAddTask)
    
    // Check if user is authenticated
    if (!user || authLoading) {
      console.error('❌ TaskContext: User not authenticated, cannot add task')
      throw new Error('User must be authenticated to create tasks')
    }
    
    try {
      console.log('🔄 TaskContext addTask - About to call supabaseAddTask...')
      const result = await supabaseAddTask(taskData)
      console.log('🔄 TaskContext addTask - supabaseAddTask result:', result)
      
      if (!result) {
        console.error('❌ TaskContext: addTask returned null/undefined')
      } else {
        console.log('✅ TaskContext: addTask successful')
      }
      
      return result
    } catch (error) {
      console.error('❌ TaskContext: addTask error:', error)
      throw error
    } finally {
      console.log('🔄 TaskContext addTask END')
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user || authLoading) {
      console.error('❌ TaskContext: User not authenticated, cannot update task')
      return null
    }
    try {
      const result = await supabaseUpdateTask(id, updates)
      return result
    } catch (error) {
      console.error('❌ TaskContext: updateTask error:', error)
      throw error
    }
  }

  const deleteTask = (id: string) => {
    if (!user || authLoading) {
      console.error('❌ TaskContext: User not authenticated, cannot delete task')
      return
    }
    supabaseDeleteTask(id)
  }

  const getFilteredTasks = () => {
    // Ensure tasks is always an array
    const safeTasks = tasks || []
    
    let filteredTasks = safeTasks

    if (searchQuery.trim()) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          task.assignees.some((assigneeId) => {
            return false
          }),
      )
    }

    switch (filter.type) {
      case "completed":
        return filteredTasks.filter((task) => task.status === "Completed")
      case "attention":
        return filteredTasks.filter((task) => task.priority === "Critical")
      case "all":
      default:
        return filteredTasks
    }
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        filter,
        searchQuery,
        addTask,
        createTaskWithAssignees: supabaseCreateTaskWithAssignees,
        updateTask,
        deleteTask,
        getTasksByStatus,
        setFilter,
        setSearchQuery,
        getFilteredTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}
