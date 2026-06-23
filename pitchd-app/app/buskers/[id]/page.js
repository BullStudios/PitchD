'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBuskerById, getBuskerStats, getFollowCounts } from '@/lib/services/buskers'
import { getProfileVideos } from '@/lib/services/videos'
import FollowButton from '@/components/FollowButton'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BuskerProfilePage() {
  const { id } = useParams()
  const [busker, setBusker] = useState(null)
  const [stats, setStats] = useState(null)
  const [follows, setFollows] = useState({ followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [videos, setVideos] = useState([])

  useEffect(() => {
    if (!id) return
    Promise.all([
      getBuskerById(id),
      getBuskerStats(id),
      getFollowCounts(id),
      getProfileVideos(id),
    ]).then(([b, s, f, v]) => {
      if (!b) { setNotFound(true); setLoading(false); return }
      setBusker(b)
      setStats(s)
      setFollows(f)
      setVideos(v)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-32" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    </main>
  )

  if (notFound) return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-center">
      <p className="text-gray-400 mb-4">Busker not found</p>
      <Link href="/buskers" className="text-sm underline hover:text-gray-600">← Back to directory</Link>
    </main>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/buskers" className="hover:text-gray-600 transition-colors">← Back to directory</Link>
      </nav>

      {/* Profile card */}
      <div className="border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            {busker.avatar_url ? (
              <img
                src={busker.avatar_url}
                alt={busker.display_name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-300">♪</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-xl font-semibold">{busker.display_name}</h1>
              <FollowButton
                targetUserId={id}
                onCountChange={delta => setFollows(f => ({ ...f, followers: f.followers + delta }))}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
              {busker.instrument && <span className="text-sm text-gray-500">🎸 {busker.instrument}</span>}
              {busker.location && <span className="text-sm text-gray-500">📍 {busker.location}</span>}
              {busker.years_busking > 0 && <span className="text-sm text-gray-400">{busker.years_busking} yr{busker.years_busking !== 1 ? 's' : ''} busking</span>}
            </div>
            {busker.bio && <p className="text-sm text-gray-500 leading-relaxed">{busker.bio}</p>}

            {/* Follow counts */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                <span className="font-semibold text-gray-700">{follows.followers}</span> followers
              </span>
              <span className="text-xs text-gray-400">
                <span className="font-semibold text-gray-700">{follows.following}</span> following
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { value: stats.visits, label: 'Pitches busked' },
            { value: stats.comments, label: 'Tips left' },
            { value: stats.photos, label: 'Photos added' },
          ].map(s => (
            <div key={s.label} className="border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold mb-0.5">{s.value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent visits */}
      {stats?.recentVisits?.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recently busked</h2>
          <div className="space-y-1">
            {stats.recentVisits.map((visit, i) => {
              const pitch = visit.pitches
              const city = pitch?.cities
              if (!pitch || !city) return null
              return (
                <Link
                  key={i}
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
        </section>
      )}
      {videos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Clips</h2>
          <div className="grid grid-cols-2 gap-3">
            {videos.map(v => (
              <div key={v.id} className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  src={v.url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
                {v.caption && (
                  <p className="text-xs text-gray-400 mt-1 px-1">{v.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
