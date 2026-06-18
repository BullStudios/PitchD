import { supabase } from '@/lib/supabase'

export async function getAllCities() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('cities')
    .select(`
      id, name, slug, lat, lng,
      permit_required, amplification_allowed,
      verified, updated_at,
      countries ( name, code )
    `)
    .order('name')

  if (error) throw error
  return data
}

export async function getCityBySlug(slug) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('cities')
    .select(`
      id, name, slug, lat, lng,
      permit_required, amplification_allowed,
      time_from, time_to, hat_allowed,
      notes, verified, verified_at, updated_at,
      countries ( name, code ),
      city_permits ( * ),
      pitches (
        id, name, description, lat, lng,
        traffic_level, amplified_allowed,
        best_days, best_time_from, best_time_to,
        tips, verified
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}
