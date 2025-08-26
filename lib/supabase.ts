import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock Supabase client for development when environment variables are missing
const createMockClient = () => {
  console.warn('⚠️ Supabase environment variables not found. Using mock client for development.')
  
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async () => ({ data: { user: null }, error: { message: 'Mock client - Supabase not configured' } }),
      signIn: async () => ({ data: { user: null }, error: { message: 'Mock client - Supabase not configured' } }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Mock client - Supabase not configured' } }),
      signInWithOtp: async () => ({ data: { user: null }, error: { message: 'Mock client - Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      setSession: async () => ({ data: { session: null }, error: { message: 'Mock client - Supabase not configured' } }),
      updateUser: async () => ({ data: { user: null }, error: { message: 'Mock client - Supabase not configured' } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: async () => ({ data: null, error: null }) }),
      update: () => ({ eq: () => ({ select: async () => ({ data: null, error: null }) }) }),
      delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  } as any
}

// Create the actual Supabase client if environment variables are available
const createRealClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

// Export the appropriate client
export const supabase = supabaseUrl && supabaseAnonKey ? createRealClient() : createMockClient()

// Note: Team member types are now defined in hooks/use-team-members.ts
// to match the actual database schema 