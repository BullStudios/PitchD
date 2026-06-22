import { supabase } from '@/lib/supabase'

export async function getPitchComments(pitchId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('pitch_comments')
    .select('id, comment, created_at, profiles(display_name)')
    .eq('pitch_id', pitchId)
    .order('created_at', { ascending: true })
  if (error) return []
  return data ?? []
}

export async function addPitchComment(pitchId, userId, comment) {
  if (!supabase) return { error: 'No client' }
  const { data, error } = await supabase
    .from('pitch_comments')
    .insert({ pitch_id: pitchId, user_id: userId, comment })
    .select('id, comment, created_at, profiles(display_name)')
    .single()
  return { data, error }
}

export async function deletePitchComment(commentId) {
  if (!supabase) return
  return supabase.from('pitch_comments').delete().eq('id', commentId)
}

export async function getRecentActivity(limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('pitch_visits')
    .select(`
      id, visited_at,
      profiles(display_name),
      pitches(id, name, cities(name, slug))
    `)
    .order('visited_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data ?? []
}

export async function getUserProfile(userId) {
  if (!supabase) return null

  const [
    { data: profile },
    { count: visitsCount },
    { count: commentsCount },
    { count: photosCount },
    { data: recentVisits },
    { data: submissions },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, created_at').eq('id', userId).single(),
    supabase.from('pitch_visits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('pitch_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('pitch_photos').select('*', { count: 'exact', head: true }).eq('uploaded_by', userId),
    supabase.from('pitch_visits')
      .select('visited_at, pitches(id, name, cities(name, slug))')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false })
      .limit(10),
    supabase.from('pitches')
      .select('id, name, status, cities(name, slug)')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false }),
  ])

  return {
    profile,
    stats: {
      visits: visitsCount ?? 0,
      comments: commentsCount ?? 0,
      photos: photosCount ?? 0,
      submissions: submissions?.length ?? 0,
    },
    recentVisits: recentVisits ?? [],
    submissions: submissions ?? [],
  }
}
