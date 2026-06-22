'use client'

import { useState, useMemo } from 'react'
import CityCard from '@/components/CityCard'
import RecentActivity from '@/components/RecentActivity'
import NearMe from '@/components/NearMe'

const FILTERS = [
  { key: 'all',       label: 'All cities' },
  { key: 'no_permit', label: 'No permit' },
  { key: 'amp',       label: 'Amp allowed' },
  { key: 'verified',  label: 'Verified' },
]

export default function CitiesClient({ cities }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = cities
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.countries?.name?.toLowerCase().includes(q)
      )
    }
    if (activeFilter === 'no_permit') result = result.filter(c => !c.permit_required)
    if (activeFilter === 'amp')       result = result.filter(c => c.amplification_allowed === 'yes' || c.amplification_allowed === 'battery_only')
    if (activeFilter === 'verified')  result = result.filter(c => c.verified)
    return result
  }, [cities, search, activeFilter])

  const isFiltering = search || activeFilter !== 'all'

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-medium mb-2">Find your pitch</h1>
      <p className="text-gray-500 mb-8">Busking rules and top spots across Europe</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left — cities */}
        <div className="lg:col-span-2">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities or countries…"
                className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
                >×</button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    activeFilter === f.key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isFiltering && (
            <p className="text-sm text-gray-400 mb-4">
              {filtered.length === 0 ? 'No cities match' : `${filtered.length} cit${filtered.length === 1 ? 'y' : 'ies'} found`}
              <button onClick={() => { setSearch(''); setActiveFilter('all') }} className="ml-3 underline hover:text-gray-600">
                Clear
              </button>
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-1">No cities found</p>
              <p className="text-sm text-gray-300">Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(city => (
                <CityCard key={city.slug} city={city} />
              ))}
            </div>
          )}
        </div>

        {/* Right — near me + activity feed */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Nearby pitches</h2>
            <NearMe />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recently busked</h2>
            <RecentActivity />
          </div>
        </div>
      </div>
    </main>
  )
}
