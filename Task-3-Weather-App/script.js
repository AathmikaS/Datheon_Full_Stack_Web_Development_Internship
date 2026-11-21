// Add your OpenWeatherMap API key here. Never commit a real key to a public repo.
const API_KEY = 'df4149413be6939b1da905b09bcffb09';
const API_BASE = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_BASE = 'https://api.openweathermap.org/geo/1.0';
const HISTORY_KEY = 'skycast-search-history-v1';
const THEME_KEY = 'skycast-theme-v1';
const HISTORY_LIMIT = 5;

const ui = {
  form: document.querySelector('#search-form'),
  searchInput: document.querySelector('#city-input'),
  searchButton: document.querySelector('.search-button'),
  searchError: document.querySelector('#search-error'),
  spinner: document.querySelector('#search-spinner'),
  locationButton: document.querySelector('#location-button'),
  recentSection: document.querySelector('#recent-searches'),
  recentList: document.querySelector('#recent-list'),
  welcome: document.querySelector('#welcome-card'),
  results: document.querySelector('#weather-results'),
  forecastGrid: document.querySelector('#forecast-grid'),
  unitButton: document.querySelector('#unit-toggle'),
  refreshButton: document.querySelector('#refresh-button')
};

let latestWeather = null;
let latestForecast = null;
let temperatureUnit = 'C';
let lastSearch = null;
let history = loadHistory();

function showLoading() {
  ui.form.classList.add('is-loading');
  ui.searchButton.disabled = true;
  ui.searchButton.setAttribute('aria-busy', 'true');
  ui.searchInput.setAttribute('aria-busy', 'true');
  ui.locationButton.disabled = true;
  ui.locationButton.setAttribute('aria-busy', 'true');
  ui.searchError.textContent = '';
}

function hideLoading() {
  ui.form.classList.remove('is-loading');
  ui.searchButton.disabled = false;
  ui.searchButton.removeAttribute('aria-busy');
  ui.searchInput.removeAttribute('aria-busy');
  ui.locationButton.disabled = false;
  ui.locationButton.removeAttribute('aria-busy');
  ui.refreshButton.classList.remove('is-refreshing');
}

function showError(message) {
  ui.searchError.textContent = message;
}

function apiErrorMessage(status, fallback) {
  if (status === 401) return 'OpenWeatherMap rejected the API key. Verify the exact key in your account, confirm your email, and allow up to 2 hours for a new key to activate. Also check that your account can use Geocoding, Current Weather, and 5-day Forecast.';
  if (status === 404) return 'We couldn’t find that city. Check the spelling or try adding its country code (for example, “Paris, FR”).';
  if (status === 429) return 'The weather service is receiving too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'The weather service is temporarily unavailable. Please try again shortly.';
  return fallback || 'We couldn’t load weather right now. Please try again.';
}

function validateCurrentWeather(data) {
  return Boolean(data && typeof data.name === 'string' && data.main && ['temp', 'feels_like', 'temp_min', 'temp_max', 'humidity', 'pressure'].every(key => Number.isFinite(data.main[key])) && Array.isArray(data.weather) && data.weather[0] && Number.isFinite(data.weather[0].id) && typeof data.weather[0].main === 'string' && data.sys && Number.isFinite(data.sys.sunrise) && Number.isFinite(data.sys.sunset));
}

function validateForecast(data) {
  return Boolean(data && data.city && Number.isFinite(data.city.timezone) && Array.isArray(data.list) && data.list.length > 0 && data.list.every(item => Number.isFinite(item.dt) && Number.isFinite(item.main?.temp) && Array.isArray(item.weather) && item.weather[0] && Number.isFinite(item.weather[0].id)));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(apiErrorMessage(response.status));
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function getCityCoordinates(city) {
  const url = `${GEOCODING_BASE}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${encodeURIComponent(API_KEY.trim())}`;
  const results = await fetchJson(url);
  if (!Array.isArray(results)) throw new Error('The location service returned an unexpected response.');
  if (!results.length) {
    const error = new Error(apiErrorMessage(404));
    error.status = 404;
    throw error;
  }
  const [match] = results;
  if (!Number.isFinite(match.lat) || !Number.isFinite(match.lon)) throw new Error('The location service returned invalid coordinates.');
  return { lat: match.lat, lon: match.lon, name: match.name, country: match.country };
}

function makeApiUrl(endpoint, location) {
  const query = typeof location === 'string'
    ? `q=${encodeURIComponent(location)}`
    : `lat=${encodeURIComponent(location.lat)}&lon=${encodeURIComponent(location.lon)}`;
  return `${API_BASE}/${endpoint}?${query}&appid=${encodeURIComponent(API_KEY.trim())}&units=metric`;
}

async function getCurrentWeather(cityOrCoordinates) {
  const data = await fetchJson(makeApiUrl('weather', cityOrCoordinates));
  if (!validateCurrentWeather(data)) throw new Error('The weather service returned an unexpected current-conditions response.');
  return data;
}

async function getWeatherForecast(cityOrCoordinates) {
  const data = await fetchJson(makeApiUrl('forecast', cityOrCoordinates));
  if (!validateForecast(data)) throw new Error('The weather service returned an unexpected forecast response.');
  return data;
}

function toCelsius(value) {
  return temperatureUnit === 'C' ? value : (value * 9 / 5) + 32;
}

function displayTemperature(value) {
  return `${Math.round(toCelsius(value))}°`;
}

function localCityTime(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

function weatherIcon(conditionId, isDay = true) {
  if (conditionId >= 200 && conditionId < 300) return ['⛈', 'Thunderstorm'];
  if (conditionId >= 300 && conditionId < 400) return ['🌦', 'Drizzle'];
  if (conditionId >= 500 && conditionId < 600) return ['🌧', 'Rain'];
  if (conditionId >= 600 && conditionId < 700) return ['❄', 'Snow'];
  if (conditionId >= 700 && conditionId < 800) return ['🌫', 'Mist or fog'];
  if (conditionId === 800) return [isDay ? '☀' : '☾', isDay ? 'Clear sky' : 'Clear night'];
  if (conditionId === 801) return [isDay ? '🌤' : '☁', 'Partly cloudy'];
  if (conditionId > 801) return ['☁', 'Clouds'];
  return ['☁', 'Weather'];
}

function cityIsDay(data) {
  const now = data.dt;
  return now >= data.sys.sunrise && now < data.sys.sunset;
}

function displayCurrentWeather(data) {
  const condition = data.weather[0];
  const isDay = cityIsDay(data);
  const [icon, iconLabel] = weatherIcon(condition.id, isDay);
  document.querySelector('#city-name').textContent = data.name;
  document.querySelector('#city-country').textContent = data.sys?.country ? data.sys.country : '';
  document.querySelector('#updated-time').textContent = `Updated ${localCityTime(data.dt, data.timezone || 0)} local time`;
  document.querySelector('#current-icon').textContent = icon;
  document.querySelector('#current-icon').setAttribute('aria-label', iconLabel);
  document.querySelector('#current-temp').textContent = Math.round(toCelsius(data.main.temp));
  document.querySelector('#current-unit').textContent = `°${temperatureUnit}`;
  document.querySelector('#current-condition').textContent = condition.main;
  document.querySelector('#current-description').textContent = condition.description || condition.main;
  document.querySelector('#feels-like').textContent = displayTemperature(data.main.feels_like);
  document.querySelector('#temp-high').textContent = displayTemperature(data.main.temp_max);
  document.querySelector('#temp-low').textContent = displayTemperature(data.main.temp_min);
  document.querySelector('#humidity').textContent = data.main.humidity;
  document.querySelector('#wind-speed').textContent = Number.isFinite(data.wind?.speed) ? data.wind.speed.toFixed(1) : '—';
  document.querySelector('#pressure').textContent = data.main.pressure;
  document.querySelector('#visibility').textContent = Number.isFinite(data.visibility) ? (data.visibility / 1000).toFixed(1) : '—';
  document.querySelector('#sunrise').textContent = localCityTime(data.sys.sunrise, data.timezone || 0);
  document.querySelector('#sunset').textContent = localCityTime(data.sys.sunset, data.timezone || 0);
  updateWeatherBackground(condition.main, isDay);
}

function forecastDayKey(timestamp, timezoneOffset) {
  return new Date((timestamp + timezoneOffset) * 1000).toISOString().slice(0, 10);
}

function forecastTimeOfDay(timestamp, timezoneOffset) {
  return new Date((timestamp + timezoneOffset) * 1000).getUTCHours();
}

function chooseDailyForecastEntries(data) {
  const groups = new Map();
  data.list.forEach(entry => {
    const key = forecastDayKey(entry.dt, data.city.timezone);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });
  return [...groups.entries()].sort(([first], [second]) => first.localeCompare(second)).slice(0, 5).map(([date, entries]) => {
    const representative = entries.reduce((closest, entry) => Math.abs(forecastTimeOfDay(entry.dt, data.city.timezone) - 12) < Math.abs(forecastTimeOfDay(closest.dt, data.city.timezone) - 12) ? entry : closest);
    // The 3-hour API's min/max fields are not daily extremes; use the sampled temperatures.
    const temperatures = entries.map(entry => entry.main.temp);
    const high = Math.max(...temperatures);
    const low = Math.min(...temperatures);
    return { date, representative, high, low };
  });
}

function createForecastCard(day, index) {
  const entry = day.representative;
  const condition = entry.weather[0];
  const [icon, iconLabel] = weatherIcon(condition.id);
  const card = document.createElement('article');
  card.className = 'forecast-card';
  card.style.animationDelay = `${index * 55}ms`;
  const date = new Date(`${day.date}T00:00:00Z`);
  const weekday = document.createElement('p');
  weekday.className = 'forecast-day';
  weekday.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(date);
  const dateLabel = document.createElement('p');
  dateLabel.className = 'forecast-date';
  dateLabel.textContent = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  const symbol = document.createElement('div');
  symbol.className = 'forecast-icon';
  symbol.setAttribute('role', 'img');
  symbol.setAttribute('aria-label', iconLabel);
  symbol.textContent = icon;
  const description = document.createElement('p');
  description.className = 'forecast-description';
  description.textContent = condition.description || condition.main;
  const range = document.createElement('div');
  range.className = 'forecast-range';
  const high = document.createElement('span');
  const low = document.createElement('span');
  high.textContent = displayTemperature(day.high);
  low.textContent = displayTemperature(day.low);
  range.append(high, low);
  card.append(weekday, dateLabel, symbol, description, range);
  return card;
}

function displayForecast(data) {
  const days = chooseDailyForecastEntries(data);
  if (!days.length) {
    const empty = document.createElement('p');
    empty.className = 'forecast-empty';
    empty.textContent = 'A forecast is not available for this location yet.';
    ui.forecastGrid.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  days.forEach((day, index) => fragment.append(createForecastCard(day, index)));
  ui.forecastGrid.replaceChildren(fragment);
}

function updateWeatherBackground(condition, isDay = true) {
  const classes = ['weather-default', 'weather-clear', 'weather-sunny', 'weather-cloudy', 'weather-rain', 'weather-snow', 'weather-night'];
  document.body.classList.remove(...classes);
  const normalized = String(condition || '').toLowerCase();
  let nextClass = 'weather-cloudy';
  if (!isDay) nextClass = 'weather-night';
  else if (normalized === 'clear') nextClass = 'weather-sunny';
  else if (['rain', 'drizzle', 'thunderstorm'].includes(normalized)) nextClass = 'weather-rain';
  else if (normalized === 'snow') nextClass = 'weather-snow';
  else if (normalized === 'clouds' || ['mist', 'smoke', 'haze', 'dust', 'fog', 'sand', 'ash', 'squall', 'tornado'].includes(normalized)) nextClass = 'weather-cloudy';
  else nextClass = 'weather-clear';
  document.body.classList.add(nextClass);
}

function setVisibleWeather(current, forecast) {
  latestWeather = current;
  latestForecast = forecast;
  displayCurrentWeather(current);
  displayForecast(forecast);
  ui.welcome.hidden = true;
  ui.results.hidden = false;
}

async function fetchWeatherForLocation(location, label) {
  if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' || !API_KEY.trim()) {
    showError('Add your OpenWeatherMap API key in script.js to load live weather. See README.md for setup instructions.');
    ui.refreshButton.classList.remove('is-refreshing');
    ui.locationButton.disabled = false;
    ui.locationButton.removeAttribute('aria-busy');
    return false;
  }
  showLoading();
  try {
    const coordinates = typeof location === 'string' ? await getCityCoordinates(location) : location;
    const [current, forecast] = await Promise.all([getCurrentWeather(coordinates), getWeatherForecast(coordinates)]);
    setVisibleWeather(current, forecast);
    lastSearch = { location: coordinates, label: current.name, type: 'coordinates' };
    if (typeof location === 'string') addToHistory(current.name, current.sys?.country);
    return true;
  } catch (error) {
    const fallback = error instanceof TypeError
      ? 'Unable to reach the weather service. Check your internet connection and try again.'
      : error instanceof SyntaxError
        ? 'The weather service returned an unreadable response. Please try again.'
        : error.message || 'Unexpected weather response. Please try another search.';
    showError(error.status ? error.message : fallback);
    return false;
  } finally {
    hideLoading();
  }
}

async function performCitySearch(city) {
  const cleanedCity = city.trim();
  if (!cleanedCity) {
    showError('Enter a city name to search.');
    ui.searchInput.focus();
    return false;
  }
  return fetchWeatherForLocation(cleanedCity, cleanedCity);
}

function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(item => typeof item?.name === 'string').slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }
  catch { /* History is a convenience; weather search still works without storage. */ }
}

function addToHistory(name, country) {
  const displayName = country ? `${name}, ${country}` : name;
  history = [{ name: displayName, query: displayName }, ...history.filter(item => item.query.toLowerCase() !== displayName.toLowerCase())].slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  ui.recentList.replaceChildren();
  history.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recent-city';
    button.textContent = item.name;
    button.addEventListener('click', () => {
      ui.searchInput.value = item.query;
      performCitySearch(item.query);
    });
    ui.recentList.append(button);
  });
  ui.recentSection.hidden = history.length === 0;
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
}

function applyTemperatureUnit() {
  if (!latestWeather || !latestForecast) return;
  displayCurrentWeather(latestWeather);
  displayForecast(latestForecast);
  document.querySelector('#unit-label').textContent = `°${temperatureUnit}`;
  ui.unitButton.setAttribute('aria-label', `Switch to ${temperatureUnit === 'C' ? 'Fahrenheit' : 'Celsius'}`);
}

function initializeTheme() {
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch { /* Use the dark default when storage is unavailable. */ }
  applyTheme(savedTheme);
  document.querySelector('.theme-toggle').addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(nextTheme);
    try { localStorage.setItem(THEME_KEY, nextTheme); } catch { /* The selected theme still applies for this visit. */ }
  });
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  document.querySelector('.theme-glyph').textContent = isLight ? '☾' : '☼';
  document.querySelector('.theme-toggle').setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#edf4fb' : '#0b1630';
}

function requestCurrentLocation() {
  if (!navigator.geolocation) {
    showError('Location is not available in this browser. Search for a city instead.');
    return;
  }
  if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' || !API_KEY.trim()) {
    showError('Add your OpenWeatherMap API key in script.js before requesting live weather.');
    return;
  }
  showError('');
  ui.locationButton.disabled = true;
  ui.locationButton.setAttribute('aria-busy', 'true');
  navigator.geolocation.getCurrentPosition(async position => {
    ui.locationButton.removeAttribute('aria-busy');
    const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
    lastSearch = { location: coords, label: 'Current location', type: 'coordinates' };
    await fetchWeatherForLocation(coords, 'Current location');
  }, error => {
    ui.locationButton.disabled = false;
    ui.locationButton.removeAttribute('aria-busy');
    const message = error.code === error.PERMISSION_DENIED
      ? 'Location permission was declined. You can still search for a city.'
      : error.code === error.POSITION_UNAVAILABLE
        ? 'Your location could not be determined. Try searching for a city.'
        : 'Location request timed out. Please try again or search for a city.';
    showError(message);
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

ui.form.addEventListener('submit', event => {
  event.preventDefault();
  performCitySearch(ui.searchInput.value);
});

ui.locationButton.addEventListener('click', requestCurrentLocation);
document.querySelector('#clear-history').addEventListener('click', clearHistory);
ui.unitButton.addEventListener('click', () => {
  temperatureUnit = temperatureUnit === 'C' ? 'F' : 'C';
  applyTemperatureUnit();
});
ui.refreshButton.addEventListener('click', async () => {
  if (!lastSearch) return;
  ui.refreshButton.classList.add('is-refreshing');
  await fetchWeatherForLocation(lastSearch.location, lastSearch.label);
});

renderHistory();
initializeTheme();
