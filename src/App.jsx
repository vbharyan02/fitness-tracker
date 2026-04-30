import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import supabase from './lib/supabase'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MainPage from './pages/MainPage'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="text-center py-8">Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={session ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/" element={session ? <MainPage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
