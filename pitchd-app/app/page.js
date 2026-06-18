import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: cities, error } = await supabase
    .from('cities')
    .select('name, slug, permit_required')

  if (error) return <p>Error: {error.message}</p>

  return (
    <main>
      <h1>PitchD</h1>
      {cities?.length === 0 && <p>No cities yet — schema is connected though!</p>}
      {cities?.map(city => (
        <p key={city.slug}>{city.name}</p>
      ))}
    </main>
  )
}