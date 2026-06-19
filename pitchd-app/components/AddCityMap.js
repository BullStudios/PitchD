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

export default function AddCityMap({ centre, onCentreSet }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    loadCss(LEAFLET_CSS, 'leaflet-css')
    loadScript(LEAFLET_JS, 'leaflet-js').then(() => {
      const L = window.L

      // Start centred on Europe
      const map = L.map(containerRef.current, {
        center: [50, 10],
        zoom: 4,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;
          background:#1a1a1a;color:white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        onCentreSet({ lat, lng })

        if (markerRef.current) markerRef.current.remove()
        markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  // If centre is cleared externally, remove marker
  useEffect(() => {
    if (!centre && markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [centre])

  return (
    <>
      <style>{`
        .leaflet-container { cursor: crosshair !important; }
      `}</style>
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: '420px' }}
      />
    </>
  )
}
