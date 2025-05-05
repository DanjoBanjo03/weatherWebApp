import React from 'react';

function CurrentWeather({ weather, locationInfo, unit }) {
  if (!weather) return null;
  return (
    <div className="current-weather">
      <h2>
        {weather.name}
        {locationInfo.state && `, ${locationInfo.state}`}
        {locationInfo.country && `, ${locationInfo.country}`}
      </h2>
      <p>
        Temperature: {Math.round(weather.main.temp)}°
        {unit === 'metric' ? 'C' : 'F'}
      </p>
      <p>
        Feels Like: {Math.round(weather.main.feels_like)}°
        {unit === 'metric' ? 'C' : 'F'}
      </p>
      <p>{weather.weather[0].description}</p>
    </div>
  );
}

export default CurrentWeather;