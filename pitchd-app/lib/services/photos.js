import { supabase } from '@/lib/supabase'

const BUCKET = 'pitch-photos'

export async function uploadPitchPhoto(pitchId, file, userId) {
  if (!supabase) return { error: 'No client' }

  const ext = file.name.split('.').pop()
  // userId as top-level folder so storage delete policy works
  const path = `${userId}/${pitchId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) return { error: uploadError }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: insertError } = await supabase.from('pitch_photos').insert({
    pitch_id: pitchId,
    uploaded_by: userId,
    storage_path: path,
    url: urlData.publicUrl,
  })

  if (insertError) return { error: insertError }

  return { url: urlData.publicUrl, error: null }
}

export async function getPitchPhotos(pitchId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('pitch_photos')
    .select('id, url, uploaded_by, created_at')
    .eq('pitch_id', pitchId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function deletePitchPhoto(photoId, storagePath) {
  if (!supabase) return
  await supabase.storage.from(BUCKET).remove([storagePath])
  return supabase.from('pitch_photos').delete().eq('id', photoId)
}
