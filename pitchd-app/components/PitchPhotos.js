'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadPitchPhoto, getPitchPhotos } from '@/lib/services/photos'

export default function PitchPhotos({ pitchId }) {
  const [user, setUser] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    getPitchPhotos(pitchId).then(p => {
      setPhotos(p)
      setLoading(false)
    })
  }, [pitchId])

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }

    setUploading(true)
    setError('')
    const { url, error: uploadError } = await uploadPitchPhoto(pitchId, file, user.id)
    setUploading(false)

    if (uploadError) {
      setError('Upload failed — please try again')
      return
    }
    setPhotos(p => [{ id: Date.now(), url, uploaded_by: user.id, created_at: new Date().toISOString() }, ...p])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) return null

  return (
    <div className="mt-3">
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo.url)}
              className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {user ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`photo-upload-${pitchId}`}
          />
          <label
            htmlFor={`photo-upload-${pitchId}`}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            {uploading ? 'Uploading…' : photos.length > 0 ? '+ Add photo' : '📷 Add a photo of this spot'}
          </label>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-xs text-gray-300">No photos yet</p>
      ) : null}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
