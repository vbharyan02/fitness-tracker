import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function MainPage() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [exercises, setExercises] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create workout form
  const [title, setTitle] = useState('')
  const [workoutDate, setWorkoutDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  // Add exercise form
  const [addingTo, setAddingTo] = useState(null)
  const [exName, setExName] = useState('')
  const [exType, setExType] = useState('strength')
  const [exSets, setExSets] = useState('')
  const [exReps, setExReps] = useState('')
  const [exWeight, setExWeight] = useState('')
  const [exDuration, setExDuration] = useState('')
  const [exFormError, setExFormError] = useState('')

  useEffect(() => { fetchWorkouts() }, [])

  async function fetchWorkouts() {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('workout_date', { ascending: false })
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache') ||
            error.message.includes('relation') || error.message.includes('Could not find')) {
          setError('Something went wrong. Please try again later.')
        } else {
          setError(error.message)
        }
        return
      }
      setWorkouts(data)
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function createWorkout(e) {
    e.preventDefault()
    setFormError('')
    if (!title.trim()) { setFormError('Title is required'); return }
    if (!workoutDate) { setFormError('Date is required'); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      title: title.trim(),
      workout_date: workoutDate,
      notes: notes.trim() || null
    })
    if (error) { setFormError(error.message); return }
    setTitle(''); setWorkoutDate(''); setNotes('')
    fetchWorkouts()
  }

  async function deleteWorkout(id) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setWorkouts(prev => prev.filter(w => w.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function toggleExpand(workoutId) {
    if (expandedId === workoutId) { setExpandedId(null); return }
    setExpandedId(workoutId)
    if (!exercises[workoutId]) await fetchExercises(workoutId)
  }

  async function fetchExercises(workoutId) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: true })
    if (error) { setError(error.message); return }
    setExercises(prev => ({ ...prev, [workoutId]: data }))
  }

  async function addExercise(e) {
    e.preventDefault()
    setExFormError('')
    if (!exName.trim()) { setExFormError('Exercise name is required'); return }
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user.id,
      workout_id: addingTo,
      exercise_name: exName.trim(),
      exercise_type: exType || 'strength'
    }
    if (exSets) payload.sets = parseInt(exSets)
    if (exReps) payload.reps = parseInt(exReps)
    if (exWeight) payload.weight_kg = parseInt(exWeight)
    if (exDuration) payload.duration_minutes = parseInt(exDuration)
    const { error } = await supabase.from('exercises').insert(payload)
    if (error) { setExFormError(error.message); return }
    const workoutId = addingTo
    setExName(''); setExType('strength'); setExSets(''); setExReps(''); setExWeight(''); setExDuration('')
    setAddingTo(null)
    fetchExercises(workoutId)
  }

  async function deleteExercise(exerciseId, workoutId) {
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)
    if (error) { setError(error.message); return }
    setExercises(prev => ({ ...prev, [workoutId]: prev[workoutId].filter(ex => ex.id !== exerciseId) }))
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Dashboard: workouts this week
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const weekCount = workouts.filter(w => new Date(w.workout_date) >= startOfWeek).length
  const recentWorkout = workouts[0]

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fitness Tracker</h1>
        <button onClick={logout} className="bg-gray-200 px-4 py-2 rounded text-sm">Logout</button>
      </div>

      {/* Dashboard summary */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>This week:</strong> {weekCount} workout{weekCount !== 1 ? 's' : ''}
        </p>
        {recentWorkout && (
          <p className="text-sm text-blue-800 mt-1">
            <strong>Last workout:</strong> {recentWorkout.title} on {recentWorkout.workout_date}
          </p>
        )}
        {!recentWorkout && (
          <p className="text-sm text-blue-800 mt-1">No workouts yet. Start logging below!</p>
        )}
      </div>

      {/* Create workout form */}
      <form onSubmit={createWorkout} className="mb-6 border rounded p-4">
        <h2 className="font-semibold mb-3">New Workout</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-2"
        />
        <input
          type="date"
          value={workoutDate}
          onChange={e => setWorkoutDate(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-2"
        />
        {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Workout</button>
      </form>

      {/* Workouts list */}
      {workouts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No workouts yet. Create your first one above.</div>
      ) : (
        <ul>
          {workouts.map(w => (
            <li key={w.id} className="border rounded mb-3 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{w.title}</p>
                  <p className="text-sm text-gray-500">{w.workout_date}</p>
                  {w.notes && <p className="text-sm text-gray-600 mt-1">{w.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleExpand(w.id)}
                    className="text-sm bg-gray-100 px-3 py-1 rounded"
                  >
                    {expandedId === w.id ? 'Hide' : 'Exercises'}
                  </button>
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedId === w.id && (
                <div className="mt-4 border-t pt-3">
                  {exercises[w.id] && exercises[w.id].length > 0 ? (
                    <ul className="mb-3">
                      {exercises[w.id].map(ex => (
                        <li key={ex.id} className="flex justify-between items-center py-1 border-b last:border-0">
                          <div className="text-sm">
                            <span className="font-medium">{ex.exercise_name}</span>
                            <span className="text-gray-400 ml-2">({ex.exercise_type})</span>
                            {ex.sets && ex.reps && <span className="text-gray-500 ml-2">{ex.sets}×{ex.reps}</span>}
                            {ex.weight_kg && <span className="text-gray-500 ml-1">{ex.weight_kg}kg</span>}
                            {ex.duration_minutes && <span className="text-gray-500 ml-2">{ex.duration_minutes}min</span>}
                          </div>
                          <button
                            onClick={() => deleteExercise(ex.id, w.id)}
                            className="text-xs text-red-500 ml-3"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">No exercises yet.</p>
                  )}

                  {addingTo === w.id ? (
                    <form onSubmit={addExercise} className="bg-gray-50 p-3 rounded">
                      <input
                        type="text"
                        placeholder="Exercise name"
                        value={exName}
                        onChange={e => setExName(e.target.value)}
                        className="border rounded px-2 py-1 w-full mb-2 text-sm"
                      />
                      <select
                        value={exType}
                        onChange={e => setExType(e.target.value)}
                        className="border rounded px-2 py-1 w-full mb-2 text-sm"
                      >
                        <option value="strength">Strength</option>
                        <option value="cardio">Cardio</option>
                        <option value="flexibility">Flexibility</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="number" placeholder="Sets" value={exSets} onChange={e => setExSets(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <input type="number" placeholder="Reps" value={exReps} onChange={e => setExReps(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <input type="number" placeholder="Weight (kg)" value={exWeight} onChange={e => setExWeight(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <input type="number" placeholder="Duration (min)" value={exDuration} onChange={e => setExDuration(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                      </div>
                      {exFormError && <p className="text-red-500 text-xs mb-2">{exFormError}</p>}
                      <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add</button>
                        <button type="button" onClick={() => setAddingTo(null)} className="bg-gray-200 px-3 py-1 rounded text-sm">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingTo(w.id)}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded"
                    >
                      + Add Exercise
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
