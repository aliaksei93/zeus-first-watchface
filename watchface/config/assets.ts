const ALARM_ASSET_ROOT = 'alarm/'
const BATTERY_ASSET_ROOT = 'battery/'
const INTERACTION_ASSET_ROOT = 'interaction/'
const WEATHER_ASSET_ROOT = 'weather/'

export const ASSETS = {
  alarm: {
    status: ALARM_ASSET_ROOT + 'status.png',
  },
  battery: {
    empty: BATTERY_ASSET_ROOT + 'empty.png',
    full: BATTERY_ASSET_ROOT + 'full.png',
    high: BATTERY_ASSET_ROOT + 'high.png',
    low: BATTERY_ASSET_ROOT + 'low.png',
    medium: BATTERY_ASSET_ROOT + 'medium.png',
  },
  interaction: {
    tap: INTERACTION_ASSET_ROOT + 'tap.png',
  },
  sun: {
    sunrise: WEATHER_ASSET_ROOT + 'sunrise.png',
    sunset: WEATHER_ASSET_ROOT + 'sunset.png',
  },
}

export const WEATHER_ICONS = [
  'cloud-sun.png', // 0  Cloudy
  'cloud-sun-rain.png', // 1  Showers
  'cloud-snow.png', // 2  Snow showers
  'sun.png', // 3  Sunny
  'cloudy.png', // 4  Overcast
  'cloud-drizzle.png', // 5  Light rain
  'cloud-snow.png', // 6  Light snow
  'cloud-rain.png', // 7  Moderate rain
  'cloud-snow.png', // 8  Moderate snow
  'cloud-snow.png', // 9  Heavy snow
  'cloud-rain-wind.png', // 10 Heavy rain
  'tornado.png', // 11 Sandstorm
  'custom-sleet.png', // 12 Rain and snow
  'cloud-fog.png', // 13 Fog
  'haze.png', // 14 Haze
  'cloud-lightning.png', // 15 Thunderstorms
  'cloud-snow.png', // 16 Snowstorm
  'wind.png', // 17 Floating dust
  'cloud-rain-wind.png', // 18 Very heavy rainstorm
  'cloud-hail.png', // 19 Rain and hail
  'custom-thunder-hail.png', // 20 Thunderstorms and hail
  'cloud-rain-wind.png', // 21 Heavy rainstorm
  'wind.png', // 22 Dust
  'tornado.png', // 23 Heavy sandstorm
  'cloud-rain-wind.png', // 24 Rainstorm
  'cloud-off.png', // 25 Unknown
  'cloud-moon.png', // 26 Cloudy nighttime
  'cloud-moon-rain.png', // 27 Showers nighttime
  'moon.png', // 28 Sunny nighttime
].map(function (icon) {
  return WEATHER_ASSET_ROOT + icon
})
