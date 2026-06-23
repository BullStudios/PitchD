'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import VideoFeed from '@/components/VideoFeed'
import VideoUpload from '@/components/VideoUpload'

export default function VideosPage() {
  const [user, setUser] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [newVideo, setNewVideo] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  function handleUploaded(video) {
    setNewVideo(video)
    setShowUpload(false)
  }

  return (
    <main className="max-w-md mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/cities" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">←</Link>
          <h1 className="font-semibold text-gray-900">Busking Clips</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => setShowUpload(s => !s)}
              className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showUpload ? 'Cancel' : '+ Upload clip'}
            </button>
          )}
          {!user && (
            <Link href="/auth/login" className="text-xs text-gray-400 hover:text-gray-600">
              Sign in to upload
            </Link>
          )}
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && user && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-3">
            Upload a clip from a busking session — this will appear in the feed. Not attached to a specific pitch? That's fine too.
          </p>
          <VideoUpload
            userId={user.id}
            onUploaded={handleUploaded}
          />
        </div>
      )}

      {/* Feed */}
      <VideoFeed />
    </main>
  )
}
