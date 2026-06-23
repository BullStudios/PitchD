import { supabase } from '@/lib/supabase'

const BUCKET = 'videos'

export async function uploadVideo({ file, userId, pitchId = null, cityId = null, caption = '' }) {
  if (!supabase) return { error: 'No client' }

  const ext = file.name.split('.').pop().toLowerCase()
  const type = pitchId ? 'pitch' : 'profile'
  const refId = pitchId ?? userId
  const path = `${type}/${refId}/${userId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) return { error: uploadError }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('videos')
    .insert({
      uploaded_by: userId,
      pitch_id: pitchId ?? null,
      city_id: cityId ?? null,
      storage_path: path,
      url: urlData.publicUrl,
      caption: caption || null,
      video_type: type,
    })
    .select('id, url, caption, video_type, created_at, uploaded_by')
    .single()

  if (error) return { error }
  return { data, error: null }
}

export async function getPitchVideos(pitchId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('videos')
    .select('id, url, caption, created_at, uploaded_by, profiles(display_name)')
    .eq('pitch_id', pitchId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getProfileVideos(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('videos')
    .select('id, url, caption, created_at, pitch_id, pitches(name, cities(name, slug))')
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getFeedVideos(limit = 20, offset = 0) {
  if (!supabase) return []
  const { data } = await supabase
    .from('videos')
    .select(`
      id, url, caption, video_type, created_at,
      uploaded_by,
      profiles(display_name, avatar_url),
      pitches(name, cities(name, slug))
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return data ?? []
}

export async function deleteVideo(videoId, storagePath) {
  if (!supabase) return
  await supabase.storage.from(BUCKET).remove([storagePath])
  return supabase.from('videos').delete().eq('id', videoId)
}
