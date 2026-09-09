import { createContext, ReactNode } from 'react'

// Minimal auth context for preview
export const AuthContext = createContext<{ userId?: string } | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}