import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return null
    }

    setProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, display_name, role, status, created_at, updated_at',
        )
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      setProfile(data ?? null)
      return data ?? null
    } catch (error) {
      console.error('No se pudo cargar el perfil:', error)
      setProfile(null)
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('No se pudo recuperar la sesión:', error)
      }

      setSession(initialSession ?? null)
      setUser(initialSession?.user ?? null)
      setSessionLoading(false)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return

        setSession(nextSession ?? null)
        setUser(nextSession?.user ?? null)

        if (!nextSession?.user) {
          setProfile(null)
        }
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (sessionLoading) return

    if (!user?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    loadProfile(user.id)
  }, [sessionLoading, user?.id, loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      return null
    }

    return loadProfile(user.id)
  }, [user?.id, loadProfile])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo(() => {
    const role = profile?.role ?? null
    const status = profile?.status ?? null

    const isOwner = role === 'owner'
    const isAdmin = role === 'admin'
    const isPlayer = role === 'player'

    const isPending = status === 'pending'
    const isActive = status === 'active'
    const isSuspended = status === 'suspended'

    return {
      session,
      user,
      profile,

      loading:
        sessionLoading ||
        (Boolean(user) && profileLoading),

      sessionLoading,
      profileLoading,

      isAuthenticated: Boolean(user),

      role,
      status,

      isOwner,
      isAdmin,
      isPlayer,

      isPending,
      isActive,
      isSuspended,

      isStaff:
        isActive && (isOwner || isAdmin),

      refreshProfile,
      signOut,
    }
  }, [
    session,
    user,
    profile,
    sessionLoading,
    profileLoading,
    refreshProfile,
    signOut,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe usarse dentro de <AuthProvider>.',
    )
  }

  return context
}
