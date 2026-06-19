'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddCityMap from '@/components/AddCityMap'
import { supabase } from '@/lib/supabase'

const COUNTRIES = [
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Poland' },
  { code: 'HU', name: 'Hungary' },
  { code: 'HR', name: 'Croatia' },
  { code: 'GR', name: 'Greece' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'IE', name: 'Ireland' },
]

export default function AddCityPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [centre, setCentre] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    country_code: 'GB',
    permit_required: false,
    amplification_allowed: 'battery_only',
    hat_allowed: true,
    time_from: '09:00',
    time_to: '22:00',
    notes: '',
  })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setChecking(false)
      if (!user) router.push('/auth/login')
    })
  }, [])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!centre) { setError('Please click the map to set the city centre first.'); return }
    setSubmitting(true)
    setError('')

    // Get or create country
    let countryId
    const { data: existingCountry } = await supabase
      .from('countries')
      .select('id')
      .eq('code', form.country_code)
      .single()

    if (existingCountry) {
      countryId = existingCountry.id
    } else {
      const country = COUNTRIES.find(c => c.code === form.country_code)
      const { data: newCountry, error: ce } = await supabase
        .from('countries')
        .insert({ code: form.country_code, name: country?.name ?? form.country_code })
        .select('id')
        .single()
      if (ce) { setError(ce.message); setSubmitting(false); return }
      countryId = newCountry.id
    }

    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { error: insertError } = await supabase.from('cities').insert({
      name: form.name,
      slug,
      country_id: countryId,
      lat: centre.lat,
      lng: centre.lng,
      permit_required: form.permit_required,
      amplification_allowed: form.amplification_allowed,
      hat_allowed: form.hat_allowed,
      time_from: form.time_from + ':00',
      time_to: form.time_to + ':00',
      notes: form.notes || null,
      submitted_by: user.id,
      status: 'pending',
      verified: false,
    })

    setSubmitting(false)
    if (insertError) { setError(insertError.message); return }
    setDone(true)
  }

  if (checking) return null

  if (done) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">🎸</div>
        <h1 className="text-xl font-semibold mb-2">City submitted!</h1>
        <p className="text-sm text-gray-400 mb-6">Thanks — it'll appear once approved. We'll check the rules and verify the details.</p>
        <Link href="/cities" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          Back to cities
        </Link>
      </div>
    </main>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/cities" className="hover:text-gray-600 transition-colors">Cities</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Add a city</span>
      </nav>

      <h1 className="text-2xl font-semibold mb-1">Add a city</h1>
      <p className="text-sm text-gray-400 mb-8">
        Know a great city for busking? Add it and we'll verify the details before it goes live.
      </p>

      {/* Map first — pan to city, click to set centre */}
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">
          Step 1 — Pan to the city and click to set the centre point
        </label>
        <AddCityMap centre={centre} onCentreSet={setCentre} />
        {centre ? (
          <p className="text-xs text-green-600 mt-2">
            ✓ Centre set at {centre.lat.toFixed(5)}, {centre.lng.toFixed(5)} — click again to move it
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-2">No centre set yet — click anywhere on the map</p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-400 mb-4">
            Step 2 — City details
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">City name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Vienna"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Country</label>
              <select
                value={form.country_code}
                onChange={e => setField('country_code', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-400 mb-4">
            Step 3 — Busking rules
          </label>
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            {/* Permit */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium">Permit required?</p>
                <p className="text-xs text-gray-400">Does this city require a busking permit?</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.permit_required}
                  onChange={e => setField('permit_required', e.target.checked)}
                  className="rounded" />
                <span className="text-sm text-gray-600">Required</span>
              </label>
            </div>

            {/* Amplification */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium">Amplification</p>
                <p className="text-xs text-gray-400">What's allowed?</p>
              </div>
              <select
                value={form.amplification_allowed}
                onChange={e => setField('amplification_allowed', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
              >
                <option value="yes">Fully allowed</option>
                <option value="battery_only">Battery only</option>
                <option value="no">Not allowed</option>
              </select>
            </div>

            {/* Hat */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium">Hat / tips allowed?</p>
                <p className="text-xs text-gray-400">Can buskers collect money?</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hat_allowed}
                  onChange={e => setField('hat_allowed', e.target.checked)}
                  className="rounded" />
                <span className="text-sm text-gray-600">Allowed</span>
              </label>
            </div>

            {/* Hours */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium">Permitted hours</p>
                <p className="text-xs text-gray-400">When is busking allowed?</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="time" value={form.time_from}
                  onChange={e => setField('time_from', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
                <span className="text-gray-400 text-sm">–</span>
                <input type="time" value={form.time_to}
                  onChange={e => setField('time_to', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Local notes <span className="text-gray-400">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            rows={3}
            placeholder="Anything useful — permit process, enforcement, best areas..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <Link href="/cities" className="text-sm text-gray-400 hover:text-gray-600">Cancel</Link>
          <button
            type="submit"
            disabled={submitting || !centre}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {submitting ? 'Submitting…' : 'Submit city'}
          </button>
        </div>
      </form>
    </main>
  )
}
