import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

interface UpdateProfileResult {
  success: boolean;
  avatarUrl?: string;
}

export const queries = {
  session: {
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  },
  userProfile: (userId: string | undefined) => ({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId
  }),
  authListener: (queryClient: any, locale: string) => ({
    queryKey: ['authListener'],
    queryFn: async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        queryClient.invalidateQueries({ queryKey: ['session'] })
        queryClient.invalidateQueries({ queryKey: ['userProfile'] })

        if (event === 'SIGNED_OUT') {
          window.location.href = `/${locale}`
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    },
    staleTime: Infinity,
  })
}

export const mutations = {
  updateProfile: {
    mutationFn: async (formData: FormData): Promise<UpdateProfileResult> => {
      // Your existing updateProfile logic
      // This is just a placeholder - you should move your actual implementation here
      return { success: true, avatarUrl: '' }
    }
  },
  signIn: {
    mutationFn: async (locale: string) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}`
        }
      })
      if (error) throw error
    }
  },
  signOut: {
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }
}