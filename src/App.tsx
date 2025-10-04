import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AuthPage from '@/components/AuthPage'
import EnhancedHomePage from '@/pages/EnhancedHomePage'
import './App.css'

// Main App Component
const AppContent: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {user ? <EnhancedHomePage /> : <AuthPage />}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              direction: 'rtl'
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}

export default App