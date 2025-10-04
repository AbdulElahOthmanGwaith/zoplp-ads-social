import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: { full_name: string; username: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error getting user:', error)
          return
        }

        setUser(currentUser)

        if (currentUser) {
          await loadProfile(currentUser.id)
        }
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success('تم تسجيل الدخول بنجاح!')
  }

  const signUp = async (email: string, password: string, userData: { full_name: string; username: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) {
      toast.error(error.message)
      throw error
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          full_name: userData.full_name,
          username: userData.username,
          interests: []
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    toast.success('تم إنشاء الحساب بنجاح! يرجى تفحص بريدك الإلكتروني.')
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success('تم تسجيل الخروج بنجاح')
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('User not logged in')

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      toast.error(error.message)
      throw error
    }

    setProfile(data)
    toast.success('تم تحديث الملف الشخصي بنجاح')
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}