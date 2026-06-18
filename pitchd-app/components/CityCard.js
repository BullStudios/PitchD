import Link from 'next/link'

export default function CityCard({ city }) {
  const country = city.countries

  return (
    <Link href={`/cities/${city.slug}`}
      className="block border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-medium text-lg">{city.name}</span>
        <span className="text-sm text-gray-400">{country?.name}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {!city.permit_required
          ? <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md">No permit</span>
          : <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md">Permit needed</span>
        }
        {city.amplification_allowed === 'yes' &&
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">Amp allowed</span>
        }
        {city.amplification_allowed === 'battery_only' &&
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">Battery amp only</span>
        }
        {city.verified &&
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">Verified</span>
        }
      </div>
    </Link>
  )
}