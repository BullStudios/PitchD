import { getCityBySlug, getAllCities } from '@/lib/services/cities'
import Link from 'next/link'
import CityMap from '@/components/CityMap'
import BuskedHereButton from '@/components/BuskedHereButton'

export const revalidate = 86400
export const dynamicParams = true

export async function generateStaticParams() {
  const cities = await getAllCities()
  return cities.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  return {
    title: `Busking in ${city.name} — PitchD`,
    description: `Busking rules, permits, and best spots in ${city.name}.`,
  }
}

function RuleRow({ label, value, yes = 'Yes', no = 'No', variant }) {
  const isGood = variant === 'good' ? value : !value
  return (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${isGood ? 'text-green-600' : 'text-amber-600'}`}>
        {value ? yes : no}
      </span>
    </div>
  )
}

function TimeRange({ from, to }) {
  if (!from && !to) return <span className="text-sm text-gray-400">Not specified</span>
  const fmt = t => t ? t.slice(0, 5) : '—'
  return (
    <span className="text-sm font-medium">{fmt(from)} – {fmt(to)}</span>
  )
}

function AmpBadge({ value }) {
  if (value === 'yes') return <span className="text-sm font-medium text-green-600">Allowed</span>
  if (value === 'battery_only') return <span className="text-sm font-medium text-blue-600">Battery only</span>
  if (value === 'no') return <span className="text-sm font-medium text-red-500">Not allowed</span>
  return <span className="text-sm text-gray-400">Unknown</span>
}

export default async function CityPage({ params }) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  const pitches = city.pitches ?? []

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/cities" className="hover:text-gray-600 transition-colors">Cities</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{city.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1">{city.name}</h1>
          <p className="text-gray-400 text-sm">{city.countries?.name}</p>
        </div>
        {city.verified && (
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full mt-1">
            ✓ Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Rules */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Busking Rules</h2>
          <div className="border border-gray-200 rounded-xl px-5">
            <RuleRow label="Permit required" value={city.permit_required} yes="Required" no="Not required" variant="bad" />
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Amplification</span>
              <AmpBadge value={city.amplification_allowed} />
            </div>
            <RuleRow label="Hat / tips allowed" value={city.hat_allowed} variant="good" />
            <div className="flex justify-between py-3">
              <span className="text-sm text-gray-500">Permitted hours</span>
              <TimeRange from={city.time_from} to={city.time_to} />
            </div>
          </div>
        </section>

        {/* Notes */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Local Notes</h2>
          {city.notes ? (
            <p className="text-sm text-gray-600 leading-relaxed">{city.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No notes yet for this city.</p>
          )}
        </section>
      </div>

      {/* Map */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">
          {pitches.length > 0 ? `Pitch Locations (${pitches.length})` : 'City Map'}
        </h2>
        <CityMap lat={city.lat} lng={city.lng} pitches={pitches} cityId={city.id} />
      </section>

      {/* Pitches list */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Top Spots</h2>
        {pitches.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No pitches listed yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pitches.map(pitch => (
              <div key={pitch.id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{pitch.name}</span>
                  {pitch.traffic_level && (
                    <span className={`text-xs px-2 py-0.5 rounded-md ml-2 shrink-0 ${
                      pitch.traffic_level === 'high' ? 'bg-green-50 text-green-700' :
                      pitch.traffic_level === 'medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {pitch.traffic_level} traffic
                    </span>
                  )}
                </div>
                {pitch.description && (
                  <p className="text-sm text-gray-500 mb-3 leading-relaxed">{pitch.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {pitch.amplified_allowed && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">Amp ok</span>
                  )}
                  {pitch.best_days && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{pitch.best_days}</span>
                  )}
                  {pitch.verified && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">✓ Verified</span>
                  )}
                </div>
                {pitch.tips && (
                  <p className="text-xs text-gray-400 mb-3 italic">💡 {pitch.tips}</p>
                )}
                <BuskedHereButton pitchId={pitch.id} initialCount={pitch.visit_count ?? 0} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
