'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { getFeedVideos } from '@/lib/services/videos'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function VideoCard({ video, isActive }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (isActive) {
      el.currentTime = 0
      el.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [isActive])

  function toggleMute() {
    if (!videoRef.current) return
    videoRef.current.muted = !muted
    setMuted(m => !m)
  }

  function togglePlay() {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
      setPlaying(false)
    } else {
      videoRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }

  const pitch = video.pitches
  const city = pitch?.cities
  const profile = video.profiles

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden snap-start"
      style={{ height: 'calc(100vh - 120px)', maxHeight: '700px' }}>

      {/* Video */}
      <video
        ref={videoRef}
        src={video.url}
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Play/pause overlay */}
      {!playing && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
        >
          <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
        </div>
      )}

      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* Bottom gradient + info */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Busker */}
            <div className="flex items-center gap-2 mb-2">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">♪</div>
              )}
              <span className="text-white font-medium text-sm">{profile?.display_name ?? 'Busker'}</span>
              <span className="text-white/50 text-xs">{timeAgo(video.created_at)}</span>
            </div>

            {/* Caption */}
            {video.caption && (
              <p className="text-white text-sm leading-relaxed mb-1 line-clamp-2">{video.caption}</p>
            )}

            {/* Location pill */}
            {pitch && city && (
              <Link
                href={`/cities/${city.slug}`}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
              >
                📍 {pitch.name} · {city.name}
              </Link>
            )}
            {!pitch && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                🎸 Profile clip
              </span>
            )}
          </div>

          {/* Right controls */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); toggleMute() }}
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VideoFeed({ initialVideos = [] }) {
  const [videos, setVideos] = useState(initialVideos)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(initialVideos.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef(null)
  const observerRef = useRef(null)
  const cardRefs = useRef([])

  useEffect(() => {
    if (initialVideos.length === 0) {
      getFeedVideos(10, 0).then(data => {
        setVideos(data)
        setLoading(false)
        setHasMore(data.length === 10)
      })
    }
  }, [])

  // Intersection observer — sets active video as user scrolls
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target)
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      { threshold: 0.6 }
    )
    cardRefs.current.forEach(el => {
      if (el) observerRef.current.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [videos])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const more = await getFeedVideos(10, videos.length)
    setVideos(v => [...v, ...more])
    setHasMore(more.length === 10)
    setLoadingMore(false)
  }

  // Load more when near the end
  useEffect(() => {
    if (activeIndex >= videos.length - 2) loadMore()
  }, [activeIndex])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-400 text-sm animate-pulse">Loading clips…</div>
    </div>
  )

  if (videos.length === 0) return (
    <div className="flex flex-col items-center justify-center h-96 text-center px-4">
      <p className="text-4xl mb-4">🎬</p>
      <p className="text-gray-500 font-medium mb-1">No clips yet</p>
      <p className="text-sm text-gray-400">Be the first to upload a clip from a pitch</p>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3 overflow-y-auto snap-y snap-mandatory"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      {videos.map((video, i) => (
        <div
          key={video.id}
          ref={el => cardRefs.current[i] = el}
          className="snap-start shrink-0"
        >
          <VideoCard video={video} isActive={i === activeIndex} />
        </div>
      ))}
      {loadingMore && (
        <div className="text-center py-4 text-sm text-gray-400 animate-pulse">Loading more…</div>
      )}
    </div>
  )
}
