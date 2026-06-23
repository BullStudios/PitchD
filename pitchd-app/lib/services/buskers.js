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
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select()
    .maybeSingle()
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

export async function getBuskerById(id) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, instrument, location, years_busking, age, gender, bio, avatar_url, created_at, show_in_directory')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getBuskerStats(userId) {
  if (!supabase) return {}
  const [
    { count: visits },
    { count: comments },
    { count: photos },
    { data: recentVisits },
  ] = await Promise.all([
    supabase.from('pitch_visits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('pitch_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('pitch_photos').select('*', { count: 'exact', head: true }).eq('uploaded_by', userId),
    supabase.from('pitch_visits')
      .select('visited_at, pitches(id, name, cities(name, slug))')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false })
      .limit(6),
  ])
  return { visits: visits ?? 0, comments: comments ?? 0, photos: photos ?? 0, recentVisits: recentVisits ?? [] }
}

// --- FOLLOWS ---
export async function getFollowCounts(userId) {
  if (!supabase) return { followers: 0, following: 0 }
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])
  return { followers: followers ?? 0, following: following ?? 0 }
}

export async function isFollowing(followerId, followingId) {
  if (!supabase || !followerId) return false
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()
  return !!data
}

export async function toggleFollow(followerId, followingId) {
  if (!supabase) return
  const already = await isFollowing(followerId, followingId)
  if (already) {
    await supabase.from('follows').delete()
      .eq('follower_id', followerId).eq('following_id', followingId)
    return false
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
    return true
  }
}

export async function getFollowingActivity(userId, limit = 20) {
  if (!supabase) return []
  // Get list of people this user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (!follows?.length) return []
  const ids = follows.map(f => f.following_id)

  const { data: visits } = await supabase
    .from('pitch_visits')
    .select('id, visited_at, user_id, pitches(id, name, cities(name, slug))')
    .in('user_id', ids)
    .order('visited_at', { ascending: false })
    .limit(limit)
  if (!visits?.length) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', ids)
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return visits.map(v => ({
    ...v,
    display_name: profileMap[v.user_id]?.display_name ?? 'A busker',
    avatar_url: profileMap[v.user_id]?.avatar_url ?? null,
  }))
}

// --- PITCH RATINGS ---
export async function getPitchRating(pitchId) {
  if (!supabase) return { average: null, count: 0 }
  const { data } = await supabase
    .from('pitch_ratings')
    .select('rating')
    .eq('pitch_id', pitchId)
  if (!data?.length) return { average: null, count: 0 }
  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
  return { average: Math.round(avg * 10) / 10, count: data.length }
}

export async function getUserRating(pitchId, userId) {
  if (!supabase || !userId) return null
  const { data } = await supabase
    .from('pitch_ratings')
    .select('rating')
    .eq('pitch_id', pitchId)
    .eq('user_id', userId)
    .maybeSingle()
  return data?.rating ?? null
}

export async function setRating(pitchId, userId, rating) {
  if (!supabase) return
  await supabase.from('pitch_ratings').upsert(
    { pitch_id: pitchId, user_id: userId, rating },
    { onConflict: 'pitch_id,user_id' }
  )
}

// --- NEAR ME ---
export async function getNearbyPitches(lat, lng, radiusKm = 50) {
  if (!supabase) return []
  // Fetch all approved pitches with city info, filter by distance client-side
  const { data, error } = await supabase
    .from('pitches')
    .select('id, name, description, lat, lng, traffic_level, amplified_allowed, tips, cities(name, slug)')
    .eq('status', 'approved')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (error || !data) return []

  function distKm(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) ** 2 +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  return data
    .map(p => ({ ...p, distanceKm: distKm(lat, lng, p.lat, p.lng) }))
    .filter(p => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
