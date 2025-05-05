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
    if (!saved) return [];
    try {
      const arr = JSON.parse(saved);
      // Remove duplicates (case-insensitive), preserving first occurrence
      const unique = arr.filter((v, i, a) =>
        a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i
      );
      return unique;
    } catch {
      return [];
    }
  });
  const [locationInfo, setLocationInfo] = useState({ state: '', country: '' });
  const [suggestions, setSuggestions] = useState([]);
  const apiKey = process.env.REACT_APP_OWM_KEY;
  
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
      );
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      // Canada-first: bring Canadian entries (country === 'CA') to the top
      const sorted = [
        ...data.filter(item => item.country === 'CA'),
        ...data.filter(item => item.country !== 'CA')
      ];
      setSuggestions(sorted);
    } catch {
      setSuggestions([]);
    }
  };

  // Debounce suggestion fetch by 300ms
  useEffect(() => {
    if (!city) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(() => {
      fetchSuggestions(city);
    }, 300);
    return () => clearTimeout(handler);
  }, [city]);

  // Fetch current weather by city name
  const fetchWeatherByCity = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      // Geocode city to get state and country
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        const { country, state } = geoData[0];
        setLocationInfo({ country, state: state || '' });
      } else {
        setLocationInfo({ country: '', state: '' });
      }
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=${unit}`
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'City not found');
      }
      const data = await res.json();
      setWeather(data);
      return true;
    } catch (err) {
      setError(err.message);
      setWeather(null);
      return false;
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
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`
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
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=${unit}`
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
    const valid = await fetchWeatherByCity(cityName);
    if (!valid) return;
    await fetchForecast(cityName);
    const newHistory = [cityName, ...history.filter(h => h.toLowerCase() !== cityName.toLowerCase())]
      .slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('weatherSearchHistory', JSON.stringify(newHistory));
    setCity('');
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
      <form
        className="search-bar"
        onSubmit={e => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Enter city name"
        />
        <button type="submit">Search</button>
        <button
          type="button"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
                () => setError('Permission denied')
              );
            }
          }}
        >
          Use My Location
        </button>
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  const selection = `${s.name}${s.state ? `, ${s.state}` : ''}, ${s.country}`;
                  setCity(selection);
                  setSuggestions([]);
                }}
              >
                {s.name}{s.state ? `, ${s.state}` : ''}, {s.country}
              </li>
            ))}
          </ul>
        )}
      </form>

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
          <h2>
            {weather.name}
            {locationInfo.state && `, ${locationInfo.state}`}
            {locationInfo.country && `, ${locationInfo.country}`}
          </h2>
          <p>Temperature: {Math.round(weather.main.temp)}°{unit === 'metric' ? 'C' : 'F'}</p>
          <p>Feels Like: {Math.round(weather.main.feels_like)}°{unit === 'metric' ? 'C' : 'F'}</p>
          <p>{weather.weather[0].description}</p>
        </div>
      )}

      {/* Forecast */}
      {forecast.length > 0 && (
        <div className="forecast-container">
          {forecast.slice(0, 5).map(day => (
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
