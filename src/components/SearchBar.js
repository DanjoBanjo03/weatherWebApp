import React from 'react';

function SearchBar({
  city,
  setCity,
  suggestions,
  setSuggestions,
  handleSearch,
  fetchSuggestions,
  fetchWeatherByCoords,
  setError
}) {
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
    >
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city name"
      />
      <button type="submit">Search</button>
      <button
        type="button"
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
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
  );
}

export default SearchBar;