'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { isFollowing, toggleFollow } from '@/lib/services/buskers'

export default function FollowButton({ targetUserId, onCountChange }) {
  const [user, setUser] = useState(null)
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user && user.id !== targetUserId) {
        const f = await isFollowing(user.id, targetUserId)
        setFollowing(f)
      }
      setLoading(false)
    })
  }, [targetUserId])

  async function handleClick() {
    if (!user || loading) return
    setLoading(true)
    const nowFollowing = await toggleFollow(user.id, targetUserId)
    setFollowing(nowFollowing)
    onCountChange?.(nowFollowing ? 1 : -1)
    setLoading(false)
  }

  // Don't show for own profile or logged-out users
  if (!user || user.id === targetUserId) return null

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-sm px-4 py-1.5 rounded-lg border transition-all ${
        following
          ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-400'
      } disabled:opacity-50`}
    >
      {loading ? '…' : following ? 'Following' : 'Follow'}
    </button>
  )
}
