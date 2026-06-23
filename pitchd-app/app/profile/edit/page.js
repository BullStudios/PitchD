'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProfile, updateProfile, uploadAvatar } from '@/lib/services/buskers'
import VideoUpload from '@/components/VideoUpload'
import { getProfileVideos } from '@/lib/services/videos'

const INSTRUMENTS = [
  'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Bass Guitar',
  'Violin', 'Cello', 'Double Bass', 'Viola',
  'Piano / Keyboard', 'Accordion',
  'Trumpet', 'Saxophone', 'Clarinet', 'Flute', 'Trombone',
  'Drums / Percussion', 'Ukulele', 'Banjo', 'Mandolin', 'Harp',
  'Vocals', 'Singer-Songwriter', 'DJ / Loop Artist', 'Other',
]

const GENDERS = ['Prefer not to say', 'Male', 'Female', 'Non-binary', 'Other']

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [userId, setUserId] = useState(null)
  const [profileVideos, setProfileVideos] = useState([])
  const [showVideoUpload, setShowVideoUpload] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    instrument: '',
    location: '',
    years_busking: '',
    age: '',
    gender: 'Prefer not to say',
    bio: '',
    show_in_directory: true,
  })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const [profile, vids] = await Promise.all([getProfile(user.id), getProfileVideos(user.id)])
      setProfileVideos(vids)
      if (profile) {
        setForm({
          display_name: profile.display_name ?? '',
          instrument: profile.instrument ?? '',
          location: profile.location ?? '',
          years_busking: profile.years_busking ?? '',
          age: profile.age ?? '',
          gender: profile.gender ?? 'Prefer not to say',
          bio: profile.bio ?? '',
          show_in_directory: profile.show_in_directory ?? true,
        })
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url)
      }
      setLoading(false)
    })
  }, [])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return }
    setUploadingAvatar(true)
    setError('')
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    const { url, error: uploadError } = await uploadAvatar(userId, file)
    setUploadingAvatar(false)
    if (uploadError) { setError('Photo upload failed'); setAvatarPreview(null) }
    else if (url) setAvatarPreview(url)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: saveError } = await updateProfile(userId, {
      display_name: form.display_name || null,
      instrument: form.instrument || null,
      location: form.location || null,
      years_busking: form.years_busking ? parseInt(form.years_busking) : null,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender !== 'Prefer not to say' ? form.gender : null,
      bio: form.bio || null,
      show_in_directory: form.show_in_directory,
    })
    setSaving(false)
    if (saveError) setError(saveError.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  if (loading) return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-32" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    </main>
  )

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/profile" className="hover:text-gray-600 transition-colors">← Back to profile</Link>
      </nav>

      <h1 className="text-2xl font-semibold mb-1">Edit profile</h1>
      <p className="text-sm text-gray-400 mb-8">Your public busker profile — shown in the directory if you opt in.</p>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-300">♪</div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? 'Uploading…' : avatarPreview ? 'Change photo' : 'Add photo'}
            </button>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP, max 5MB</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Display name <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={form.display_name}
            onChange={e => setField('display_name', e.target.value)}
            placeholder="e.g. JazzSteve"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {/* Instrument */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Main instrument</label>
          <select
            value={form.instrument}
            onChange={e => setField('instrument', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
          >
            <option value="">Select instrument…</option>
            {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Based in</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setField('location', e.target.value)}
            placeholder="e.g. Bristol, UK"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Years busking */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Years busking</label>
            <input
              type="number"
              min="0"
              max="60"
              value={form.years_busking}
              onChange={e => setField('years_busking', e.target.value)}
              placeholder="e.g. 5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Age <span className="text-gray-300">(optional)</span></label>
            <input
              type="number"
              min="16"
              max="100"
              value={form.age}
              onChange={e => setField('age', e.target.value)}
              placeholder="e.g. 34"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Gender <span className="text-gray-300">(optional)</span></label>
          <select
            value={form.gender}
            onChange={e => setField('gender', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
          >
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Bio <span className="text-gray-300">(optional)</span></label>
          <textarea
            value={form.bio}
            onChange={e => setField('bio', e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Tell other buskers a bit about yourself — your style, influences, favourite cities…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
          />
          <p className="text-xs text-gray-300 mt-1 text-right">{form.bio.length}/300</p>
        </div>

        {/* Profile clips */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Profile clips</label>
          {profileVideos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {profileVideos.map(v => (
                <div key={v.id} className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <video src={v.url} className="w-full h-full object-cover opacity-80" muted playsInline preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm">▶</div>
                </div>
              ))}
            </div>
          )}
          {!showVideoUpload ? (
            <button type="button" onClick={() => setShowVideoUpload(true)}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-500 hover:border-gray-400 transition-colors">
              + Add a clip to your profile
            </button>
          ) : (
            <VideoUpload
              userId={userId}
              onUploaded={v => { setProfileVideos(prev => [v, ...prev]); setShowVideoUpload(false) }}
            />
          )}
        </div>

        {/* Directory opt-in */}
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_in_directory}
              onChange={e => setField('show_in_directory', e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Show me in the busker directory</p>
              <p className="text-xs text-gray-400 mt-0.5">Other users can find and view your profile. Uncheck to stay private.</p>
            </div>
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between pt-1">
          <Link href="/profile" className="text-sm text-gray-400 hover:text-gray-600">Cancel</Link>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">✓ Saved</span>}
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}
