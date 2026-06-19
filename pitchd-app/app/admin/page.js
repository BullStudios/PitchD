'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getPendingPitches, approvePitch, rejectPitch } from '@/lib/services/pitches'
import { getPendingCities, approveCity, rejectCity } from '@/lib/services/admin'

// Replace with your Supabase user ID — find it in Authentication → Users
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID

export default function AdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [pitches, setPitches] = useState([])
  const [cities, setCities] = useState([])
  const [tab, setTab] = useState('pitches')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || (ADMIN_USER_ID && user.id !== ADMIN_USER_ID)) {
        router.push('/cities')
        return
      }
      const [p, c] = await Promise.all([getPendingPitches(), getPendingCities()])
      setPitches(p)
      setCities(c)
      setReady(true)
    })
  }, [])

  async function handlePitch(id, approve) {
    if (approve) await approvePitch(id)
    else await rejectPitch(id)
    setPitches(ps => ps.filter(p => p.id !== id))
  }

  async function handleCity(id, approve) {
    if (approve) await approveCity(id)
    else await rejectCity(id)
    setCities(cs => cs.filter(c => c.id !== id))
  }

  if (!ready) return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-sm text-gray-400">Checking access…</p>
    </main>
  )

  const pendingCount = pitches.length + cities.length

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Admin</h1>
          <p className="text-sm text-gray-400">
            {pendingCount === 0 ? 'Nothing pending — all clear.' : `${pendingCount} item${pendingCount !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        <Link href="/cities" className="text-sm text-gray-400 hover:text-gray-600">← Cities</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { key: 'pitches', label: `Pitches ${pitches.length > 0 ? `(${pitches.length})` : ''}` },
          { key: 'cities',  label: `Cities ${cities.length > 0  ? `(${cities.length})`  : ''}` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pitches tab */}
      {tab === 'pitches' && (
        <div className="space-y-4">
          {pitches.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No pending pitches.</p>
          ) : pitches.map(pitch => (
            <div key={pitch.id} className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{pitch.name}</p>
                  <p className="text-sm text-gray-400">{pitch.cities?.name} · {pitch.traffic_level} traffic</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePitch(pitch.id, true)}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handlePitch(pitch.id, false)}
                    className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500">
                <span>📍 {pitch.lat?.toFixed(5)}, {pitch.lng?.toFixed(5)}</span>
                {pitch.amplified_allowed && <span>🔊 Amp ok</span>}
                {pitch.tips && <span className="col-span-2 mt-1 italic">💡 {pitch.tips}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cities tab */}
      {tab === 'cities' && (
        <div className="space-y-4">
          {cities.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No pending cities.</p>
          ) : cities.map(city => (
            <div key={city.id} className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{city.name}</p>
                  <p className="text-sm text-gray-400">{city.countries?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCity(city.id, true)}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCity(city.id, false)}
                    className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>📍 {city.lat?.toFixed(4)}, {city.lng?.toFixed(4)}</span>
                <span>{city.permit_required ? '⚠️ Permit required' : '✓ No permit'}</span>
                <span>{city.amplification_allowed === 'yes' ? '🔊 Amp allowed' : city.amplification_allowed === 'battery_only' ? '🔋 Battery only' : '🔇 No amp'}</span>
                <span>{city.time_from?.slice(0,5)} – {city.time_to?.slice(0,5)}</span>
                {city.notes && <span className="col-span-2 mt-1 italic">📝 {city.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
