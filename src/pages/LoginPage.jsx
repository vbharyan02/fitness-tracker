import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Wrong email or password.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account.')
      } else {
        setError(error.message)
      }
      return
    }
    navigate('/')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-3"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Login
        </button>
      </form>
      <p className="text-center text-sm mt-4">
        No account? <Link to="/register" className="text-blue-600 underline">Register</Link>
      </p>
    </div>
  )
}
