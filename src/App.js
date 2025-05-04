import './App.css';
import React, { useState, useEffect } from 'react';

function App() {
  // State variables
  const [city, setCity] = useState('Toronto');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState('metric');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('weatherSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch current weather by city name
  const fetchWeatherByCity = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=5e7cdc95d41a19e79db2f60967553c44&units=${unit}`
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'City not found');
      }
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current weather by coordinates
  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=5e7cdc95d41a19e79db2f60967553c44&units=${unit}`
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Location error');
      }
      const data = await res.json();
      setWeather(data);
      setCity(data.name);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch 5-day forecast by city name
  const fetchForecast = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=5e7cdc95d41a19e79db2f60967553c44&units=${unit}`
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Forecast not found');
      }
      const data = await res.json();
      if (!data.list) {
        throw new Error('No forecast data available');
      }
      const daily = {};
      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        (daily[date] = daily[date] || []).push(item);
      });
      const forecastArray = Object.entries(daily).map(([date, items]) => {
        const temps = items.map(i => i.main.temp);
        return {
          date,
          min: Math.min(...temps),
          max: Math.max(...temps),
          icon: items[0].weather[0].icon,
          description: items[0].weather[0].description,
        };
      });
      setForecast(forecastArray);
    } catch (err) {
      setError(err.message);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  // Combined search handler that updates history
  const handleSearch = async (searchCity) => {
    const cityName = (searchCity || city).trim();
    if (!cityName) {
      setError('Please enter a city name.');
      return;
    }
    await fetchWeatherByCity(cityName);
    await fetchForecast(cityName);
    const newHistory = [cityName, ...history.filter(h => h.toLowerCase() !== cityName.toLowerCase())]
      .slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('weatherSearchHistory', JSON.stringify(newHistory));
    setCity(cityName);
  };

  // Use browser geolocation on initial load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          fetchWeatherByCoords(coords.latitude, coords.longitude);
          fetchForecast(city);
        },
        () => handleSearch('Toronto')
      );
    } else {
      handleSearch('Toronto');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when unit changes
  useEffect(() => {
    handleSearch(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Controls */}
      <div className="controls">
        <button onClick={() => setUnit(u => u === 'metric' ? 'imperial' : 'metric')}>
          Switch to {unit === 'metric' ? '°F' : '°C'}
        </button>
        <button onClick={() => setDarkMode(d => !d)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <h1>Weather Dashboard</h1>

      {/* Search */}
      <div className="search-bar">
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Enter city name"
        />
        <button onClick={() => handleSearch()}>Search</button>
        <button onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
              () => setError('Permission denied')
            );
          }
        }}>
          Use My Location
        </button>
      </div>

      {/* Recent Searches */}
      {history.length > 0 && (
        <div className="history-container">
          <h3>Recent Searches</h3>
          <div>
            {history.map(h => (
              <button key={h} onClick={() => handleSearch(h)}>
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Current Weather */}
      {weather && !loading && !error && (
        <div className="current-weather">
          <h2>{weather.name}</h2>
          <p>Temperature: {Math.round(weather.main.temp)}°{unit === 'metric' ? 'C' : 'F'}</p>
          <p>Feels Like: {Math.round(weather.main.feels_like)}°{unit === 'metric' ? 'C' : 'F'}</p>
          <p>{weather.weather[0].description}</p>
        </div>
      )}

      {/* Forecast */}
      {forecast.length > 0 && (
        <div className="forecast-container">
          {forecast.slice(0, 7).map(day => (
            <div key={day.date} className={`forecast-card ${darkMode ? 'dark' : 'light'}`}>
              <h4>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</h4>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.description}
              />
              <p>{day.description}</p>
              <p>Min: {Math.round(day.min)}°{unit === 'metric' ? 'C' : 'F'}</p>
              <p>Max: {Math.round(day.max)}°{unit === 'metric' ? 'C' : 'F'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
