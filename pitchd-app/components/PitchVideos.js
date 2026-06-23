'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getPitchVideos } from '@/lib/services/videos'
import VideoUpload from '@/components/VideoUpload'

export default function PitchVideos({ pitchId, cityId }) {
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    getPitchVideos(pitchId).then(v => { setVideos(v); setLoading(false) })
  }, [pitchId])

  function handleUploaded(newVideo) {
    setVideos(v => [newVideo, ...v])
    setShowUpload(false)
  }

  if (loading) return null

  return (
    <div className="mt-3">
      {/* Thumbnail strip */}
      {videos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          {videos.map(v => (
            <button
              key={v.id}
              onClick={() => setPlaying(playing === v.id ? null : v.id)}
              className="shrink-0 relative w-20 h-14 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity bg-black"
            >
              <video
                src={v.url}
                className="w-full h-full object-cover opacity-80"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg">{playing === v.id ? '⏸' : '▶'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Inline player */}
      {playing && (() => {
        const v = videos.find(v => v.id === playing)
        if (!v) return null
        return (
          <div className="mb-3 rounded-xl overflow-hidden bg-black">
            <video
              src={v.url}
              controls
              autoPlay
              playsInline
              className="w-full max-h-56"
            />
            {v.caption && <p className="text-xs text-gray-400 p-2">{v.caption}</p>}
          </div>
        )
      })()}

      {/* Upload */}
      {user && !showUpload && (
        <button
          onClick={() => setShowUpload(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {videos.length > 0 ? '+ Add clip' : '🎬 Add a clip of this spot'}
        </button>
      )}
      {user && showUpload && (
        <VideoUpload
          userId={user.id}
          pitchId={pitchId}
          cityId={cityId}
          onUploaded={handleUploaded}
        />
      )}
      {!user && videos.length === 0 && (
        <p className="text-xs text-gray-300">No clips yet</p>
      )}
    </div>
  )
}
