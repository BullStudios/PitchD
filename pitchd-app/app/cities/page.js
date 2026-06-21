import { getAllCities } from '@/lib/services/cities'
import CitiesClient from '@/components/CitiesClient'

export const revalidate = 86400

export default async function CitiesPage() {
  const cities = await getAllCities()
  return <CitiesClient cities={cities} />
}
