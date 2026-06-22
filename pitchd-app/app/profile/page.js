'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/services/comments'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({ value, label }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 text-center">
      <p className="text-3xl font-semibold mb-1">{value}</p>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const profile = await getUserProfile(user.id)
      setData(profile)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-40" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    </main>
  )

  if (!data) return null

  const { profile, stats, recentVisits, submissions } = data
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Back + Header */}
      <nav className="text-sm text-gray-400 mb-6">
        <a href="/cities" className="hover:text-gray-600 transition-colors">← Back to cities</a>
      </nav>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">
          {profile?.display_name ?? 'Your profile'}
        </h1>
        {joinedDate && <p className="text-sm text-gray-400">Member since {joinedDate}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard value={stats.visits} label="Pitches busked" />
        <StatCard value={stats.submissions} label="Spots submitted" />
        <StatCard value={stats.photos} label="Photos added" />
        <StatCard value={stats.comments} label="Tips left" />
      </div>

      {/* Recent visits */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recently busked</h2>
        {recentVisits.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No visits logged yet —{' '}
            <Link href="/cities" className="underline hover:text-gray-600">find a pitch</Link>
            {' '}and hit "I busked here".
          </p>
        ) : (
          <div className="space-y-1">
            {recentVisits.map(visit => {
              const pitch = visit.pitches
              const city = pitch?.cities
              if (!pitch || !city) return null
              return (
                <Link
                  key={visit.id ?? pitch.id}
                  href={`/cities/${city.slug}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{pitch.name}</p>
                    <p className="text-xs text-gray-400">{city.name}</p>
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-gray-400 transition-colors">
                    {timeAgo(visit.visited_at)}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Submissions */}
      {submissions.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Your submissions</h2>
          <div className="space-y-2">
            {submissions.map(pitch => (
              <div key={pitch.id} className="flex items-center justify-between py-2.5 px-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">{pitch.name}</p>
                  <p className="text-xs text-gray-400">{pitch.cities?.name}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  pitch.status === 'approved'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {pitch.status === 'approved' ? '✓ Live' : 'Pending review'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
