'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getNearbyPitches } from '@/lib/services/buskers'

const TRAFFIC_COLORS = { high: 'text-green-600', medium: 'text-amber-600', low: 'text-gray-400' }

export default function NearMe() {
  const [state, setState] = useState('idle') // idle | loading | results | error
  const [pitches, setPitches] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  function handleClick() {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser')
      setState('error')
      return
    }
    setState('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const nearby = await getNearbyPitches(latitude, longitude, 50)
        setPitches(nearby)
        setState('results')
      },
      (err) => {
        setErrorMsg(err.code === 1 ? 'Location access denied — please allow location in your browser settings' : 'Could not get your location')
        setState('error')
      },
      { timeout: 10000 }
    )
  }

  if (state === 'idle') return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
    >
      <span>📍</span> Near me
    </button>
  )

  if (state === 'loading') return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="animate-spin">◌</span> Finding nearby pitches…
    </div>
  )

  if (state === 'error') return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-red-500">{errorMsg}</p>
      <button onClick={() => setState('idle')} className="text-xs text-gray-400 underline">Try again</button>
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">
          {pitches.length === 0 ? 'No pitches found nearby' : `${pitches.length} pitch${pitches.length !== 1 ? 'es' : ''} near you`}
        </h2>
        <button onClick={() => { setState('idle'); setPitches([]) }} className="text-xs text-gray-400 hover:text-gray-600 underline">
          Clear
        </button>
      </div>

      {pitches.length === 0 ? (
        <p className="text-sm text-gray-400">No pitches within 50km. Try adding one!</p>
      ) : (
        <div className="space-y-2">
          {pitches.map(pitch => (
            <Link
              key={pitch.id}
              href={`/cities/${pitch.cities?.slug}`}
              className="flex items-start justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{pitch.name}</p>
                <p className="text-xs text-gray-400">{pitch.cities?.name}</p>
                {pitch.traffic_level && (
                  <p className={`text-xs mt-0.5 ${TRAFFIC_COLORS[pitch.traffic_level] ?? 'text-gray-400'}`}>
                    {pitch.traffic_level} traffic
                    {pitch.amplified_allowed && ' · amp ok'}
                  </p>
                )}
                {pitch.tips && (
                  <p className="text-xs text-gray-400 mt-1 italic truncate">💡 {pitch.tips}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-3 mt-0.5 group-hover:text-gray-600">
                {pitch.distanceKm < 1
                  ? `${Math.round(pitch.distanceKm * 1000)}m`
                  : `${pitch.distanceKm.toFixed(1)}km`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
