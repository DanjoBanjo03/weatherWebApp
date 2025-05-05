import React from 'react';
import ForecastCard from './ForecastCard';

function ForecastList({ forecast, unit, darkMode }) {
  if (!forecast || forecast.length === 0) return null;
  return (
    <div className="forecast-container">
      {forecast.slice(0, 5).map((day) => (
        <ForecastCard
          key={day.date}
          day={day}
          unit={unit}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
}

export default ForecastList;