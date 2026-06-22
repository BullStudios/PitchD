'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRecentActivity } from '@/lib/services/comments'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function RecentActivity() {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentActivity(15).then(data => {
      setActivity(data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-gray-50 animate-pulse" />
      ))}
    </div>
  )

  if (activity.length === 0) return (
    <p className="text-sm text-gray-300 italic">No activity yet — be the first to log a visit!</p>
  )

  return (
    <div className="space-y-2">
      {activity.map(item => {
        const pitch = item.pitches
        const city = pitch?.cities
        if (!pitch || !city) return null
        return (
          <Link
            key={item.id}
            href={`/cities/${city.slug}`}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base shrink-0">♪</span>
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  <span className="font-medium">{item.profiles?.username ?? 'A busker'}</span>
                  {' '}played{' '}
                  <span className="text-gray-500">{pitch.name}</span>
                </p>
                <p className="text-xs text-gray-400">{city.name}</p>
              </div>
            </div>
            <span className="text-xs text-gray-300 shrink-0 ml-3 group-hover:text-gray-400 transition-colors">
              {timeAgo(item.visited_at)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
