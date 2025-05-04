import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';

function App() {
  const [city, setCity] = useState('Toronto'); //store city name
  const [weather, setWeather] = useState(null); //store weather data
  const [loading, setLoading] = useState(false); //store loading state
  const [error, setError] = useState(null); //store error state

  // Function to fetch weather data by city name
  const fetchWeatherByCity = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=5e7cdc95d41a19e79db2f60967553c44&units=metric`
      );
      if (!response.ok) throw new Error('City not found');
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally { setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=5e7cdc95d41a19e79db2f60967553c44&units=metric`
      );
      if (!response.ok) throw new Error ('Location error');
      const data = await response.json();
      setWeather(data);
      setCity(data.name);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      () => {
        setError('Permission denied or unavailable');
      }
    );
  };

  // load toronto weather on page load
  useEffect(() => {
    fetchWeatherByCity(city);
  }, []);
  
  // Handle Manual Search
  const handleSearch = () => {
    fetchWeatherByCity(city);
  };

  return (
    <div style = {{ padding: '20px'}}>
    <h1>Weather App</h1>

    {/* City Input */}
    <input
      type="text"
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="Enter city name"
    />
    <button onClick={handleSearch}>Search</button>

    {/* Location Button */}
    <button onClick={handleUseMyLocation} style={{ marginLeft: '10px' }}>
      Use My Location
    </button>

    {/* Status messsages */}
    {loading && <p>Loading...</p>}
    {error && <p style={{ color: 'red' }}>{error}</p>}

    {/* Display weather data */}
    {weather && !loading && !error && (
      <div>
        <h2>{weather.name}</h2>
        <p>Temperature: {weather.main.temp}°C</p>
        <p>Description: {weather.weather[0].description}</p>
      </div>
    )}
    </div>
  );
}

export default App;
