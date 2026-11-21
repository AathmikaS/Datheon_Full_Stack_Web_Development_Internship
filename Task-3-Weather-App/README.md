# SkyCast — Real-Time Weather & Forecast

SkyCast is a responsive weather dashboard built for the Datheon Full Stack Web Development Internship, Task 3. It uses the OpenWeatherMap Current Weather and 5 Day / 3 Hour Forecast APIs to show actual city conditions, six weather telemetry readings, and one forecast card per local calendar day.

## Features

- City search with Enter-key support, validation, loading indicator, and clear API errors.
- Current temperature, conditions, description, feels-like, high, low, and weather icon.
- Humidity, wind speed, pressure, visibility, sunrise, and sunset.
- Five daily forecast cards, using the 3-hour entry closest to local midday and daily high/low values from that day's entries.
- Celsius/Fahrenheit conversion without another API request.
- Weather and day/night responsive gradient backgrounds.
- Recent successful city searches, stored locally and shown as shortcuts.
- Browser geolocation, with clear permission and failure messages.
- Refresh control and last-updated time.
- Dark/light appearance preference stored locally.
- Responsive layout and reduced-motion support.
- Safe text rendering with DOM APIs and `textContent`.

## Technologies

HTML5, CSS3 (Grid, Flexbox, media queries, and custom properties), vanilla JavaScript (ES6+), Fetch API, async/await, browser `localStorage`, OpenWeatherMap REST APIs, and the Geolocation API.

## Folder structure

```text
Task-3-Weather-App/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── images/
```

Task 1 and Task 2 remain in their existing folders beside this project and were not modified.

## OpenWeatherMap API key setup

1. Create an account at [OpenWeatherMap](https://openweathermap.org/) and create an API key from your account dashboard.
2. Open `script.js` and replace the placeholder near the top:

   ```js
   const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
   ```

   with your key, keeping the surrounding quotes. The app will show setup instructions instead of fake weather while the placeholder remains.
3. A newly created API key may take some time to become active. If the service returns `401`, verify the key and try again later.
4. Before publishing the project, do not commit your real key to a public repository. A key embedded in frontend JavaScript can be inspected by visitors. Restrict it in your provider settings where possible. For production deployments requiring secret protection, route requests through a backend proxy that keeps the key server-side.

### If you see an API key error

OpenWeatherMap documents `401` responses for missing or incorrect keys, keys that have not activated, and account/product access issues. Confirm the exact key on your account's API Keys page, verify your account email, and allow up to two hours for a newly created key to activate. Check access to the Geocoding, Current Weather, and 5 Day / 3 Hour Forecast products. The app trims accidental surrounding whitespace before sending the key, but it cannot repair an incorrect or inactive key. See the provider's [API key FAQ](https://openweathermap.org/faq).

OpenWeatherMap's free-tier availability, request limits, and plan terms can change; check the current provider dashboard and API documentation for your account's access.

## Run locally

Open this folder in VS Code and open `index.html` in a modern browser, or use VS Code **Open with Live Server**. Search a city after configuring the API key. Geolocation generally requires a secure context such as `https://` or localhost; browsers may block it when opened as a `file://` page. City search can also be affected by browser cross-origin restrictions, so use Live Server if a browser blocks the API request.

No frontend build step or framework is used. The weather service itself requires an internet connection and a valid API key.

## How the API integration works

For city search, the app first uses OpenWeatherMap's Geocoding API to resolve the city name to coordinates, then sends two weather requests in parallel using `fetch()`. Coordinate-based location searches skip geocoding:

- City lookup: `/geo/1.0/direct`, then current and forecast requests use the returned latitude/longitude. This avoids relying on the provider's deprecated built-in city-name lookup.
- Current conditions: `/data/2.5/weather`, with coordinates and `units=metric`.
- Forecast: `/data/2.5/forecast`, with the same coordinates and metric units.

`fetch()` returns a Promise. `async` functions and `await` let the code wait for the response and decoded JSON while the browser remains responsive. The response is checked for HTTP errors and expected fields before the page is updated. `try/catch/finally` displays friendly errors, preserves the last successful display on failure, and always turns the loading indicator off.

The forecast API returns entries about every three hours. SkyCast groups them by the date in the requested city's timezone, chooses the entry closest to noon for that day's icon and description, and calculates the daily sampled high and low from that date's temperature readings. It uses up to five available calendar dates from the provider response.

## Screenshots

Screenshot placeholder: capture the app after configuring a key, save the image to `assets/images/skycast-screenshot.png`, then add:

```md
![SkyCast weather dashboard](assets/images/skycast-screenshot.png)
```

## Known limitations

- No real API requests can succeed until you provide an active OpenWeatherMap key and internet access. This project does not include a key or hardcoded weather.
- A frontend key is visible to visitors. Use a backend proxy for deployments where key secrecy is required.
- Search history and the theme are stored only in the current browser profile on the current device. They are not synced.
- Geolocation requires browser permission and is commonly restricted to secure contexts. If it is unavailable or declined, use city search.
- The five-day / three-hour product may not provide five full future calendar days late in the forecast window; SkyCast displays the available forecast dates.

## Author

**Aathmika Sarveswaran** — Datheon Full Stack Web Development Internship participant.
