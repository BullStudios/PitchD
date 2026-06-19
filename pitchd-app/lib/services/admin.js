import { supabase } from '@/lib/supabase'

export async function getPendingCities() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('cities')
    .select(`*, countries(name, code)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function approveCity(id) {
  if (!supabase) return
  return supabase.from('cities').update({ status: 'approved' }).eq('id', id)
}

export async function rejectCity(id) {
  if (!supabase) return
  return supabase.from('cities').delete().eq('id', id)
}
