import { getAllCities } from '@/lib/services/cities'
import CityCard from '@/components/CityCard'

export const revalidate = 86400 // rebuild every 24 hours

export default async function CitiesPage() {
  const cities = await getAllCities()

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-medium mb-2">Find your pitch</h1>
      <p className="text-gray-500 mb-8">Busking rules and top spots across Europe</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map(city => (
          <CityCard key={city.slug} city={city} />
        ))}
      </div>
    </main>
  )
}