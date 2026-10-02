import React, { useState, useEffect, useContext, useCallback } from 'react'

const AuthContext = React.createContext({ user: null, loading: true })

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // The server decides isAdmin, so always read the user back from /api/auth/me.
  const refresh = useCallback(async () => {
    try {
      const data = await fetch('/api/auth/me').then(res => res.json())
      setUser(data.user || null)
      return data.user || null
    } catch (err) {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = useCallback(async (email, password) => {
    await postJson('/api/auth/login', { email, password })
    return refresh()
  }, [refresh])

  const signup = useCallback(async (name, email, password) => {
    await postJson('/api/auth/signup', { name, email, password })
    return refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await postJson('/api/auth/logout')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => useContext(AuthContext)

export {
  AuthProvider,
  useAuth
}
