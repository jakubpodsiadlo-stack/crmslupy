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

/** Po tym czasie UI przestaje czekać na profil (zapobiega wiecznemu „Ładowanie profilu”). */
const PROFILE_FETCH_TIMEOUT_MS = 25_000

async function fetchProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('fetchProfile', error)
      return { profile: null, errorMessage: error.message ?? String(error) }
    }
    return { profile: data ?? null, errorMessage: null }
  } catch (e) {
    console.error('fetchProfile', e)
    return { profile: null, errorMessage: e?.message ?? 'Błąd sieci' }
  }
}

async function fetchProfileWithTimeout(userId) {
  let timeoutId
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(
              `Brak odpowiedzi z serwera po ${PROFILE_FETCH_TIMEOUT_MS / 1000} s (sprawdź sieć i adres Supabase).`,
            ),
          ),
        PROFILE_FETCH_TIMEOUT_MS,
      )
    })
    const result = await Promise.race([fetchProfile(userId), timeoutPromise])
    clearTimeout(timeoutId)
    return result
  } catch (e) {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    console.error('fetchProfileWithTimeout', e)
    return { profile: null, errorMessage: e?.message ?? String(e) }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFetchError, setProfileFetchError] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setProfileFetchError(null)
      return
    }
    const { profile: p, errorMessage } = await fetchProfileWithTimeout(user.id)
    setProfile(p)
    setProfileFetchError(errorMessage)
  }, [user?.id])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      setProfileLoading(false)
      setProfileFetchError(null)
      return
    }
    let cancelled = false
    setProfileLoading(true)
    setProfileFetchError(null)
    fetchProfileWithTimeout(user.id)
      .then(({ profile: p, errorMessage }) => {
        if (!cancelled) {
          setProfile(p)
          setProfileFetchError(errorMessage)
          setProfileLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('fetchProfile effect', e)
          setProfile(null)
          setProfileFetchError(e?.message ?? String(e))
          setProfileLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setProfileFetchError(null)
    setProfileLoading(false)
  }, [])

  const resetPassword = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}/auth/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    return { error }
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      profileLoading,
      profileFetchError,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      profileLoading,
      profileFetchError,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth musi być wewnątrz AuthProvider')
  return ctx
}
