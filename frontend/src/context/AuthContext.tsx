import { createContext, useContext, useState, useEffect } from 'react'
import { useFrappeAuth } from 'frappe-react-sdk'

interface AuthContextType {
  currentUser: any
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login: frappeLogin, logout: frappeLogout, currentUser: frappeUser, updateCurrentUser, isLoading } = useFrappeAuth()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await updateCurrentUser()
        setCurrentUser(frappeUser)
      } catch (error) {
        console.error('Error initializing auth:', error)
      }
    }

    initializeAuth()
  }, [frappeUser])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      await frappeLogin(credentials)
      await updateCurrentUser()
      setCurrentUser(frappeUser)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await frappeLogout()
      setCurrentUser(null)
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 