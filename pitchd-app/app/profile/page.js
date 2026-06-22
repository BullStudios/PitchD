'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/services/buskers'
import { getUserProfile } from '@/lib/services/comments'

function StatCard({ value, label }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-2xl font-semibold mb-0.5">{value}</p>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1,mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const [p, a] = await Promise.all([
        getProfile(user.id),
        getUserProfile(user.id),
      ])
      setProfile(p)
      setActivity(a)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-32" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    </main>
  )

  const stats = activity?.stats ?? {}
  const recentVisits = activity?.recentVisits ?? []
  const submissions = activity?.submissions ?? []

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/cities" className="hover:text-gray-600 transition-colors">← Back to cities</Link>
      </nav>

      {/* Profile card */}
      <div className="border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-300">
                ♪
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">
                  {profile?.display_name ?? 'Your profile'}
                </h1>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {profile?.instrument && (
                    <span className="text-sm text-gray-500">🎸 {profile.instrument}</span>
                  )}
                  {profile?.location && (
                    <span className="text-sm text-gray-500">📍 {profile.location}</span>
                  )}
                  {profile?.years_busking && (
                    <span className="text-sm text-gray-500">{profile.years_busking} yr{profile.years_busking !== 1 ? 's' : ''} busking</span>
                  )}
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:border-gray-400 transition-colors shrink-0"
              >
                Edit profile
              </Link>
            </div>
            {profile?.bio && (
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{profile.bio}</p>
            )}
            {!profile?.display_name && (
              <p className="text-sm text-gray-400 mt-2 italic">
                <Link href="/profile/edit" className="underline hover:text-gray-600">Complete your profile</Link> to appear in the busker directory.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard value={stats.visits ?? 0} label="Pitches busked" />
        <StatCard value={stats.submissions ?? 0} label="Spots submitted" />
        <StatCard value={stats.photos ?? 0} label="Photos added" />
        <StatCard value={stats.comments ?? 0} label="Tips left" />
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
                  pitch.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
                }`}>
                  {pitch.status === 'approved' ? '✓ Live' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
