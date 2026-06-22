'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getPitchRating, getUserRating, setRating } from '@/lib/services/buskers'

function Star({ filled, half, onClick, onHover, size = 16 }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className="focus:outline-none transition-transform hover:scale-110"
      style={{ fontSize: size, lineHeight: 1, background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default', padding: '1px' }}
    >
      <span style={{ color: filled || half ? '#f59e0b' : '#d1d5db' }}>
        {half ? '⯨' : filled ? '★' : '☆'}
      </span>
    </button>
  )
}

export default function PitchRating({ pitchId }) {
  const [user, setUser] = useState(null)
  const [average, setAverage] = useState(null)
  const [count, setCount] = useState(0)
  const [userRating, setUserRating] = useState(null)
  const [hover, setHover] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    getPitchRating(pitchId).then(({ average, count }) => {
      setAverage(average)
      setCount(count)
    })
  }, [pitchId])

  useEffect(() => {
    if (!user) return
    getUserRating(pitchId, user.id).then(setUserRating)
  }, [user, pitchId])

  async function handleRate(stars) {
    if (!user || saving) return
    setSaving(true)
    await setRating(pitchId, user.id, stars)
    setUserRating(stars)
    // Recalculate average locally
    const { average: newAvg, count: newCount } = await getPitchRating(pitchId)
    setAverage(newAvg)
    setCount(newCount)
    setSaving(false)
  }

  const displayRating = hover ?? userRating ?? average ?? 0

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="flex"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            filled={displayRating >= star}
            half={!Number.isInteger(displayRating) && Math.ceil(displayRating) === star}
            onClick={user ? () => handleRate(star) : undefined}
            onHover={user ? () => setHover(star) : undefined}
            size={15}
          />
        ))}
      </div>
      {count > 0 ? (
        <span className="text-xs text-gray-400">
          {average} · {count} rating{count !== 1 ? 's' : ''}
        </span>
      ) : (
        <span className="text-xs text-gray-300">
          {user ? 'Be the first to rate' : 'No ratings yet'}
        </span>
      )}
    </div>
  )
}
