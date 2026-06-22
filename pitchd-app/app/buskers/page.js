'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getAllBuskers } from '@/lib/services/buskers'

const INSTRUMENTS = [
  'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Bass Guitar',
  'Violin', 'Cello', 'Piano / Keyboard', 'Accordion',
  'Trumpet', 'Saxophone', 'Clarinet', 'Flute', 'Trombone',
  'Drums / Percussion', 'Ukulele', 'Banjo', 'Mandolin', 'Harp',
  'Vocals', 'Singer-Songwriter', 'DJ / Loop Artist', 'Other',
]

function BuskerCard({ busker }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className="shrink-0">
        {busker.avatar_url ? (
          <img
            src={busker.avatar_url}
            alt={busker.display_name}
            className="w-14 h-14 rounded-full object-cover border border-gray-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl text-gray-300">
            ♪
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{busker.display_name}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {busker.instrument && (
            <span className="text-xs text-gray-500">🎸 {busker.instrument}</span>
          )}
          {busker.location && (
            <span className="text-xs text-gray-500">📍 {busker.location}</span>
          )}
          {busker.years_busking > 0 && (
            <span className="text-xs text-gray-400">{busker.years_busking} yr{busker.years_busking !== 1 ? 's' : ''} busking</span>
          )}
        </div>
        {busker.bio && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{busker.bio}</p>
        )}
      </div>
    </div>
  )
}

export default function BuskersPage() {
  const [buskers, setBuskers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [instrument, setInstrument] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    getAllBuskers().then(data => {
      setBuskers(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    return buskers.filter(b => {
      const matchSearch = !search || b.display_name?.toLowerCase().includes(search.toLowerCase())
      const matchInstrument = !instrument || b.instrument?.toLowerCase().includes(instrument.toLowerCase())
      const matchLocation = !location || b.location?.toLowerCase().includes(location.toLowerCase())
      return matchSearch && matchInstrument && matchLocation
    })
  }, [buskers, search, instrument, location])

  const isFiltering = search || instrument || location

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/cities" className="hover:text-gray-600 transition-colors">← Back to cities</Link>
      </nav>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-semibold">Busker directory</h1>
      </div>
      <p className="text-sm text-gray-400 mb-8">Find buskers by instrument or location</p>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <select
          value={instrument}
          onChange={e => setInstrument(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white text-gray-600"
        >
          <option value="">All instruments</option>
          {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">📍</span>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Filter by location…"
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {isFiltering && (
        <p className="text-sm text-gray-400 mb-4">
          {filtered.length === 0 ? 'No buskers match' : `${filtered.length} busker${filtered.length !== 1 ? 's' : ''} found`}
          <button
            onClick={() => { setSearch(''); setInstrument(''); setLocation('') }}
            className="ml-3 underline hover:text-gray-600"
          >Clear</button>
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 && !isFiltering ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-2">No buskers in the directory yet</p>
          <p className="text-sm text-gray-300">
            <Link href="/profile/edit" className="underline hover:text-gray-500">Edit your profile</Link>
            {' '}and opt in to appear here
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No buskers match those filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(busker => (
            <BuskerCard key={busker.id} busker={busker} />
          ))}
        </div>
      )}
    </main>
  )
}
