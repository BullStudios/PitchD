'use client'

import { useState, useEffect } from 'react'
import { getCityWeather, buskingOutlook } from '@/lib/services/weather'

const TONE_STYLES = {
  good: 'bg-green-50 text-green-700 border-green-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad:  'bg-red-50 text-red-600 border-red-200',
}

function dayLabel(dateStr, index) {
  if (index === 0) return 'Today'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}

export default function CityWeather({ lat, lng }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lat || !lng) return
    getCityWeather(lat, lng).then(data => {
      setWeather(data)
      setLoading(false)
    })
  }, [lat, lng])

  if (loading) {
    return <div className="h-20 rounded-xl bg-gray-50 animate-pulse" />
  }

  if (!weather) {
    return null // fail silently — weather is a nice-to-have, not critical
  }

  const outlook = buskingOutlook(weather.current)

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weather.current.icon}</span>
          <div>
            <p className="text-2xl font-semibold leading-none">{weather.current.temp}°C</p>
            <p className="text-xs text-gray-400 mt-1">{weather.current.label}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>💨 {weather.current.windSpeed} km/h</p>
        </div>
      </div>

      {outlook && (
        <div className={`text-xs px-3 py-2 rounded-lg border mb-4 ${TONE_STYLES[outlook.tone]}`}>
          {outlook.label}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {weather.daily.map((day, i) => (
          <div key={day.date} className="text-center">
            <p className="text-xs text-gray-400 mb-1">{dayLabel(day.date, i)}</p>
            <p className="text-lg">{day.icon}</p>
            <p className="text-xs font-medium mt-1">{day.tempMax}°</p>
            <p className="text-xs text-gray-300">{day.tempMin}°</p>
          </div>
        ))}
      </div>
    </div>
  )
}
