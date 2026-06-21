// Open-Meteo — completely free, no API key required
// https://open-meteo.com/

const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌦️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Heavy showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm', icon: '⛈️' },
  99: { label: 'Thunderstorm', icon: '⛈️' },
}

export function describeWeatherCode(code) {
  return WEATHER_CODES[code] ?? { label: 'Unknown', icon: '🌡️' }
}

export async function getCityWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=4`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    return {
      current: {
        temp: Math.round(data.current.temperature_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        precipitation: data.current.precipitation,
        ...describeWeatherCode(data.current.weather_code),
      },
      daily: data.daily.time.map((date, i) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipChance: data.daily.precipitation_probability_max[i],
        ...describeWeatherCode(data.daily.weather_code[i]),
      })),
    }
  } catch {
    return null
  }
}

// Simple busking-suitability heuristic based on conditions
export function buskingOutlook(current) {
  if (!current) return null
  if (current.precipitation > 0.5) return { label: 'Rain — not great for busking', tone: 'bad' }
  if (current.windSpeed > 30) return { label: 'Windy — sheet music and stands will struggle', tone: 'warn' }
  if (current.temp < 5) return { label: 'Cold — bundle up, fingers may stiffen', tone: 'warn' }
  if (current.temp > 30) return { label: 'Hot — bring water, watch your gear in the sun', tone: 'warn' }
  return { label: 'Good conditions for busking', tone: 'good' }
}
