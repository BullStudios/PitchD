'use client'

import { useEffect, useRef } from 'react'

export default function CityMap({ lat, lng, pitches = [] }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return
    if (mapRef.current) return // already initialised

    let mapboxgl
    import('mapbox-gl').then(mod => {
      mapboxgl = mod.default
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [lng, lat],
        zoom: 13,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      pitches.forEach(pitch => {
        if (!pitch.lat || !pitch.lng) return

        const el = document.createElement('div')
        el.className = 'pitch-marker'
        el.style.cssText = `
          width: 28px; height: 28px;
          background: #1a1a1a; color: white;
          border-radius: 50%; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        `
        el.textContent = '♪'

        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false })
          .setHTML(`
            <div style="font-family: inherit; padding: 2px 0">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px">${pitch.name}</div>
              ${pitch.traffic_level ? `<div style="font-size: 11px; color: #888">${pitch.traffic_level} traffic</div>` : ''}
            </div>
          `)

        new mapboxgl.Marker(el)
          .setLngLat([pitch.lng, pitch.lat])
          .setPopup(popup)
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

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 h-64 flex items-center justify-center">
        <p className="text-sm text-gray-400">Map requires <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code></p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .mapboxgl-popup-content { border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-72 rounded-xl overflow-hidden border border-gray-200"
      />
    </>
  )
}
