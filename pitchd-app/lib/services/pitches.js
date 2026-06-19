import { supabase } from '@/lib/supabase'

export async function toggleBuskedHere(pitchId, userId) {
  if (!supabase) return { error: 'No client' }

  // Check if visit exists
  const { data: existing } = await supabase
    .from('pitch_visits')
    .select('id')
    .eq('pitch_id', pitchId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('pitch_visits')
      .delete()
      .eq('pitch_id', pitchId)
      .eq('user_id', userId)
    return { removed: true, error }
  } else {
    const { error } = await supabase
      .from('pitch_visits')
      .insert({ pitch_id: pitchId, user_id: userId })
    return { removed: false, error }
  }
}

export async function getPitchVisitCount(pitchId) {
  if (!supabase) return 0
  const { count } = await supabase
    .from('pitch_visits')
    .select('*', { count: 'exact', head: true })
    .eq('pitch_id', pitchId)
  return count ?? 0
}

export async function getUserVisitedPitches(userId) {
  if (!supabase || !userId) return []
  const { data } = await supabase
    .from('pitch_visits')
    .select('pitch_id')
    .eq('user_id', userId)
  return data?.map(v => v.pitch_id) ?? []
}

export async function getPendingPitches() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('pitches')
    .select(`*, cities(name, slug)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function approvePitch(id) {
  if (!supabase) return
  return supabase.from('pitches').update({ status: 'approved' }).eq('id', id)
}

export async function rejectPitch(id) {
  if (!supabase) return
  return supabase.from('pitches').delete().eq('id', id)
}
