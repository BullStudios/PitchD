'use client'

import { useState, useRef } from 'react'
import { uploadVideo } from '@/lib/services/videos'

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
const MAX_BYTES = 50 * 1024 * 1024 // 50MB

export default function VideoUpload({ userId, pitchId = null, cityId = null, onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  function validate(f) {
    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      return 'Please choose an MP4, WebM or MOV video file'
    }
    if (f.size > MAX_BYTES) return 'Video must be under 50MB (aim for 15-30 seconds)'
    return null
  }

  function handleFile(f) {
    const err = validate(f)
    if (err) { setError(err); return }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function handleUpload() {
    if (!file || !userId) return
    setUploading(true)
    setProgress(10)
    const tick = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 300)
    const { data, error: uploadError } = await uploadVideo({ file, userId, pitchId, cityId, caption })
    clearInterval(tick)
    setProgress(100)
    setUploading(false)
    if (uploadError) {
      setError('Upload failed — please try again')
      setProgress(0)
      return
    }
    onUploaded?.(data)
    setFile(null)
    setPreview(null)
    setCaption('')
    setProgress(0)
  }

  function handleCancel() {
    setFile(null)
    setPreview(null)
    setCaption('')
    setError('')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (preview) return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <video
        src={preview}
        controls
        className="w-full rounded-lg max-h-48 bg-black"
        playsInline
      />
      <input
        type="text"
        value={caption}
        onChange={e => setCaption(e.target.value)}
        maxLength={100}
        placeholder="Add a caption… (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      {uploading && (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload clip'}
        </button>
        <button
          onClick={handleCancel}
          disabled={uploading}
          className="px-4 text-sm border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        className="hidden"
      />
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <p className="text-2xl mb-1">🎬</p>
        <p className="text-sm text-gray-500 font-medium">Drop a clip or tap to choose</p>
        <p className="text-xs text-gray-300 mt-1">MP4, WebM or MOV · max 50MB · aim for 15-30 sec</p>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
