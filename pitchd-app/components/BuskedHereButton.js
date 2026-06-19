'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toggleBuskedHere } from '@/lib/services/pitches'

export default function BuskedHereButton({ pitchId, initialCount = 0 }) {
  const [user, setUser] = useState(null)
  const [visited, setVisited] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('pitch_visits')
          .select('id')
          .eq('pitch_id', pitchId)
          .eq('user_id', user.id)
          .single()
        setVisited(!!data)
      }
    })
  }, [pitchId])

  async function handleClick() {
    if (!user || loading) return
    setLoading(true)
    const { removed, error } = await toggleBuskedHere(pitchId, user.id)
    if (!error) {
      setVisited(!removed)
      setCount(c => removed ? c - 1 : c + 1)
    }
    setLoading(false)
  }

  if (!user) return (
    <a href="/auth/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
      Sign in to log a visit
    </a>
  )

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
        visited
          ? 'bg-green-50 border-green-200 text-green-700 font-medium'
          : 'border-gray-200 text-gray-500 hover:border-gray-400'
      } disabled:opacity-50`}
    >
      <span>{visited ? '✓' : '♪'}</span>
      <span>{visited ? 'Busked here' : 'I busked here'}</span>
      {count > 0 && <span className={`ml-0.5 ${visited ? 'text-green-600' : 'text-gray-400'}`}>· {count}</span>}
    </button>
  )
}
