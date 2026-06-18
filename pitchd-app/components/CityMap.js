'use client'

import { useEffect, useRef } from 'react'

export default function CityMap({ lat, lng, pitches = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // Inject Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then(mod => {
      const L = mod.default

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      })

      // CartoDB Positron — clean, minimal, no API key
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      const pitchIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:30px;height:30px;
          background:#1a1a1a;color:white;
          border-radius:50%;border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          cursor:pointer;
        ">♪</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
      })

      pitches.forEach(pitch => {
        if (!pitch.lat || !pitch.lng) return
        const popup = L.popup({ closeButton: false, className: 'pitchd-popup' }).setContent(`
          <div style="font-size:13px;line-height:1.4">
            <div style="font-weight:600;margin-bottom:2px">${pitch.name}</div>
            ${pitch.traffic_level ? `<div style="color:#888;font-size:11px">${pitch.traffic_level} traffic</div>` : ''}
            ${pitch.tips ? `<div style="color:#555;font-size:11px;margin-top:4px">💡 ${pitch.tips}</div>` : ''}
          </div>
        `)
        L.marker([pitch.lat, pitch.lng], { icon: pitchIcon })
          .bindPopup(popup)
          .addTo(map)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, pitches])

  return (
    <>
      <style>{`
        .pitchd-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          padding: 0;
        }
        .pitchd-popup .leaflet-popup-content { margin: 10px 14px; }
        .pitchd-popup .leaflet-popup-tip { box-shadow: none; }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-72 rounded-xl overflow-hidden border border-gray-200"
      />
    </>
  )
}
