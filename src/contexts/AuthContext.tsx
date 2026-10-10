'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'
import type { User, ApiResponse, LoginResponse, RegisterResponse } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (key: string, email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (stored && storedUser) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password })
    if (!data.token || !data.user) throw new Error(data.error || 'Login failed')

    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken || '')
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (key: string, email: string, username: string, password: string) => {
    const { data } = await api.post<ApiResponse<RegisterResponse>>('/auth/register', { key, email, username, password })
    if (!data.token || !data.user) throw new Error(data.error || 'Registration failed')

    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken || '')
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse>('/auth/me')
      if (data.user) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
