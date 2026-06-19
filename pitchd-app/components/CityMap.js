'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve()
    const s = document.createElement('script')
    s.id = id; s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}
function loadCss(href, id) {
  if (document.getElementById(id)) return
  const l = document.createElement('link')
  l.id = id; l.rel = 'stylesheet'; l.href = href
  document.head.appendChild(l)
}

const TRAFFIC_COLORS = { high: '#16a34a', medium: '#d97706', low: '#6b7280' }

function markerHtml(color) {
  return `<div style="width:28px;height:28px;background:${color};color:white;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer">♪</div>`
}

const FILTERS = [
  { key: 'all',        label: 'All spots' },
  { key: 'high',       label: '🟢 High traffic' },
  { key: 'medium',     label: '🟡 Medium' },
  { key: 'amp',        label: '🔊 Amp ok' },
]

export default function CityMap({ lat, lng, pitches = [], cityId }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [user, setUser] = useState(null)
  const [clickLatLng, setClickLatLng] = useState(null)
  const [form, setForm] = useState({ name: '', traffic_level: 'medium', amplified_allowed: false, tips: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)
  const tempMarkerRef = useRef(null)

  // Check auth
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    loadCss(LEAFLET_CSS, 'leaflet-css')
    loadScript(LEAFLET_JS, 'leaflet-js').then(() => {
      const L = window.L
      const map = L.map(containerRef.current, { center: [lat, lng], zoom: 14 })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map)

      // Map click — drop pin for submission
      map.on('click', (e) => {
        setClickLatLng(e.latlng)
        setSubmitDone(false)
        setForm({ name: '', traffic_level: 'medium', amplified_allowed: false, tips: '' })
        if (tempMarkerRef.current) tempMarkerRef.current.remove()
        const el = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;background:#3b82f6;color:white;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.25)">+</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        })
        tempMarkerRef.current = L.marker([e.latlng.lat, e.latlng.lng], { icon: el }).addTo(map)
      })

      mapRef.current = map
      renderMarkers(L, pitches, 'all')
    })
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [lat, lng])

  function renderMarkers(L, data, filter) {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const filtered = data.filter(p => {
      if (filter === 'high') return p.traffic_level === 'high'
      if (filter === 'medium') return p.traffic_level === 'medium'
      if (filter === 'amp') return p.amplified_allowed
      return true
    })

    filtered.forEach(pitch => {
      if (!pitch.lat || !pitch.lng) return
      const color = TRAFFIC_COLORS[pitch.traffic_level] ?? '#6b7280'
      const icon = L.divIcon({ className: '', html: markerHtml(color), iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16] })
      const marker = L.marker([pitch.lat, pitch.lng], { icon })
        .bindPopup(`
          <div style="font-size:13px;line-height:1.5;min-width:140px">
            <div style="font-weight:600;margin-bottom:3px">${pitch.name}</div>
            ${pitch.traffic_level ? `<div style="color:${color};font-size:11px;font-weight:500;margin-bottom:2px">${pitch.traffic_level} traffic</div>` : ''}
            ${pitch.amplified_allowed ? `<div style="font-size:11px;color:#3b82f6">🔊 Amp ok</div>` : ''}
            ${pitch.tips ? `<div style="color:#555;font-size:11px;margin-top:5px">💡 ${pitch.tips}</div>` : ''}
          </div>
        `, { closeButton: false })
        .addTo(mapRef.current)
      markersRef.current.push(marker)
    })
  }

  function handleFilter(key) {
    setActiveFilter(key)
    if (!mapRef.current || !window.L) return
    renderMarkers(window.L, pitches, key)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clickLatLng || !user || !supabase) return
    setSubmitting(true)
    const { error } = await supabase.from('pitches').insert({
      city_id: cityId,
      name: form.name,
      lat: clickLatLng.lat,
      lng: clickLatLng.lng,
      traffic_level: form.traffic_level,
      amplified_allowed: form.amplified_allowed,
      tips: form.tips || null,
      submitted_by: user.id,
      status: 'pending',
      verified: false,
    })
    setSubmitting(false)
    if (!error) {
      setSubmitDone(true)
      if (tempMarkerRef.current) { tempMarkerRef.current.remove(); tempMarkerRef.current = null }
      setClickLatLng(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeFilter === f.key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-gray-300 self-center ml-auto hidden sm:block">
          {user ? 'Click map to suggest a pitch' : 'Sign in to suggest a pitch'}
        </span>
      </div>

      {/* Map */}
      <style>{`
        .leaflet-popup-content-wrapper{border-radius:10px !important;box-shadow:0 4px 12px rgba(0,0,0,0.12) !important;}
        .leaflet-popup-content{margin:10px 14px !important;}
        .leaflet-popup-tip{box-shadow:none !important;}
      `}</style>
      <div ref={containerRef} className="w-full h-80 rounded-xl overflow-hidden border border-gray-200" />

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span><span style={{color:'#16a34a'}}>●</span> High traffic</span>
        <span><span style={{color:'#d97706'}}>●</span> Medium</span>
        <span><span style={{color:'#6b7280'}}>●</span> Low / unknown</span>
      </div>

      {/* Submit pitch panel */}
      {clickLatLng && user && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 mt-2">
          {submitDone ? (
            <div className="text-center py-2">
              <div className="text-xl mb-1">🎸</div>
              <p className="text-sm font-medium text-gray-700">Thanks! Your pitch has been submitted for review.</p>
              <button onClick={() => setSubmitDone(false)} className="text-xs text-gray-400 mt-2 hover:underline">Submit another</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Suggest a pitch</h3>
                <button onClick={() => {
                  setClickLatLng(null)
                  if (tempMarkerRef.current) { tempMarkerRef.current.remove(); tempMarkerRef.current = null }
                }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Spot name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dam Square north entrance"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Foot traffic</label>
                    <select
                      value={form.traffic_level}
                      onChange={e => setForm(f => ({ ...f, traffic_level: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.amplified_allowed}
                        onChange={e => setForm(f => ({ ...f, amplified_allowed: e.target.checked }))}
                        className="rounded"
                      />
                      Amp allowed here
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tips (optional)</label>
                  <input
                    type="text"
                    value={form.tips}
                    onChange={e => setForm(f => ({ ...f, tips: e.target.value }))}
                    placeholder="e.g. Avoid market days, best after 6pm"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">
                    📍 {clickLatLng.lat.toFixed(5)}, {clickLatLng.lng.toFixed(5)}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit pitch'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {clickLatLng && !user && (
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            <a href="/auth/login" className="text-gray-900 font-medium hover:underline">Sign in</a> to suggest a pitch at this location
          </p>
        </div>
      )}
    </div>
  )
}
