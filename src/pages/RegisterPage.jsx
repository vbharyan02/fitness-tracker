import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists.')
      } else if (error.message.includes('Signups not allowed')) {
        setError('Sign up is currently disabled.')
      } else {
        setError(error.message)
      }
      return
    }
    if (data.session) {
      navigate('/')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
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
          Register
        </button>
      </form>
      <p className="text-center text-sm mt-4">
        Have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
      </p>
    </div>
  )
}
