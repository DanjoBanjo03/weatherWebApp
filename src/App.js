import './App.css';
import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import History from './components/History';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';

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

  // Re-fetch when unit changes, using the last successful weather.city
  useEffect(() => {
    if (weather && weather.name) {
      fetchWeatherByCity(weather.name);
      fetchForecast(weather.name);
    }
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

      <SearchBar
        city={city}
        setCity={setCity}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        handleSearch={handleSearch}
        fetchSuggestions={fetchSuggestions}
        fetchWeatherByCoords={fetchWeatherByCoords}
        setError={setError}
      />

      <History historyList={history} handleSearch={handleSearch} />

      {/* Status */}
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <CurrentWeather
        weather={weather}
        locationInfo={locationInfo}
        unit={unit}
      />

      <ForecastList
        forecast={forecast}
        unit={unit}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;
