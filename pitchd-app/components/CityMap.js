'use client'

import { useEffect, useRef } from 'react'

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

export default function CityMap({ lat, lng, pitches = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    loadCss(LEAFLET_CSS, 'leaflet-css')
    loadScript(LEAFLET_JS, 'leaflet-js').then(() => {
      const L = window.L

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 14,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      const pitchIcon = L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;background:#1a1a1a;color:white;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">♪</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
      })

      pitches.forEach(pitch => {
        if (!pitch.lat || !pitch.lng) return
        L.marker([pitch.lat, pitch.lng], { icon: pitchIcon })
          .bindPopup(`
            <div style="font-size:13px;line-height:1.4">
              <div style="font-weight:600;margin-bottom:2px">${pitch.name}</div>
              ${pitch.traffic_level ? `<div style="color:#888;font-size:11px">${pitch.traffic_level} traffic</div>` : ''}
              ${pitch.tips ? `<div style="color:#555;font-size:11px;margin-top:4px">💡 ${pitch.tips}</div>` : ''}
            </div>
          `, { closeButton: false })
          .addTo(map)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [lat, lng, pitches])

  return (
    <>
      <style>{`
        .leaflet-popup-content-wrapper { border-radius:10px !important; box-shadow:0 4px 12px rgba(0,0,0,0.12) !important; }
        .leaflet-popup-content { margin:10px 14px !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-72 rounded-xl overflow-hidden border border-gray-200" />
    </>
  )
}
