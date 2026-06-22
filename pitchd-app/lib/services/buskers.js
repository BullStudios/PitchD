import { supabase } from '@/lib/supabase'

const AVATAR_BUCKET = 'avatars'

export async function getProfile(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function updateProfile(userId, updates) {
  if (!supabase) return { error: 'No client' }
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

export async function uploadAvatar(userId, file) {
  if (!supabase) return { error: 'No client' }
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (uploadError) return { error: uploadError }
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  // Add cache-bust
  const url = `${data.publicUrl}?t=${Date.now()}`
  await updateProfile(userId, { avatar_url: data.publicUrl })
  return { url, error: null }
}

export async function getAllBuskers({ search = '', instrument = '', location = '' } = {}) {
  if (!supabase) return []
  let query = supabase
    .from('profiles')
    .select('id, display_name, instrument, location, years_busking, bio, avatar_url, show_in_directory')
    .eq('show_in_directory', true)
    .order('display_name')

  if (search) query = query.ilike('display_name', `%${search}%`)
  if (instrument) query = query.ilike('instrument', `%${instrument}%`)
  if (location) query = query.ilike('location', `%${location}%`)

  const { data, error } = await query
  if (error) { console.error('getAllBuskers:', error); return [] }
  return data ?? []
}
