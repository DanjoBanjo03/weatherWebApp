import React from 'react';

function ForecastCard({ day, unit, darkMode }) {
  return (
    <div className={`forecast-card ${darkMode ? 'dark' : 'light'}`}>
      <h4>
        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
      </h4>
      <img
        src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
        alt={day.description}
      />
      <p>{day.description}</p>
      <p>
        Min: {Math.round(day.min)}°
        {unit === 'metric' ? 'C' : 'F'}
      </p>
      <p>
        Max: {Math.round(day.max)}°
        {unit === 'metric' ? 'C' : 'F'}
      </p>
    </div>
  );
}

export default ForecastCard;