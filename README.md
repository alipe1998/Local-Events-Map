# Local Events Map API — Day 2 (Codespaces)

An educational mini‑project that serves a GeoJSON feed with **Node.js + Express** and displays it on a web page with **Leaflet**. Designed to run entirely in **GitHub Codespaces** (no database, no Docker).

---

## What you’ll build

* A tiny REST‑style API endpoint: `GET /api/events` → returns events as **GeoJSON FeatureCollection**.
* A static web page (`/`) that fetches the API and renders markers on a **Leaflet** map.
* Run + share via **Codespaces Port Forwarding**.

<p align="center"><em>Conceptual flow</em>: Browser → (HTTP) → Express → (reads file) → GeoJSON → Browser → Leaflet renders markers</p>

---

## Tech Primer (quick explanations)

**Node.js** — JavaScript runtime on the server (lets JS run outside the browser).
**Express** — Minimal web framework for Node; defines routes (URLs) and responses.
**HTTP** — The request/response protocol your browser uses to talk to the server.
**GeoJSON** — A standard JSON format for geographic data; maps/libraries know how to read it.
**Leaflet** — Lightweight JS mapping library for rendering maps, markers, popups.
**CORS** — Browser security rule. If your page and API live on different origins, you must allow cross‑origin requests.

> Mental model: **Express** is a short‑order cook. You (the browser) place an order at a route like `/api/events`. Express grabs the data (our `.geojson` file), plates it as JSON, and sends it back. **Leaflet** is the waiter who brings it to your table (the map) and places each “dish” (marker) exactly where it belongs.

---

## Repository structure

```
.
├── package.json
├── server.js                 # Express server
├── public/
│   ├── index.html            # Leaflet page
│   ├── app.js                # Frontend JS: fetches /api/events and adds markers
│   └── styles.css            # (optional) small styles
└── data/
    └── events.geojson        # Static GeoJSON FeatureCollection
```

---

## Quickstart (GitHub Codespaces)

1. **Create Codespace**: Open this repo on GitHub → “Code” → **Create codespace on main**.
2. **Install deps** (first run only):

   ```bash
   npm install
   ```
3. **Run the server**:

   ```bash
   npm run dev
   ```

   This starts Express on port **3000** (see `server.js`).
4. **Expose the port**: In the Codespaces Ports panel, forward **3000** → set visibility to **Public**. Copy the URL.
5. **Open the app**: Visit the forwarded URL (you should see the map and event markers). The API is at `<your-url>/api/events`.

> Tip: If you change files, **nodemon** auto‑reloads the server. Refresh the browser to pick up frontend changes.

---

## Scripts (package.json)

```json
{
  "name": "local-events-map-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

* `type: module` enables modern `import` syntax in Node.
* `nodemon` restarts the server on file changes; great for development.

---

## Server (Express)

**server.js**

```js
import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// If your frontend is served by this same Express app, CORS is not required.
// If you open index.html from a different origin, enable CORS:
app.use(cors());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint: returns GeoJSON from disk
app.get('/api/events', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'events.geojson');
    const json = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(json);
    res.json(data);
  } catch (err) {
    console.error('Error reading GeoJSON:', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
```

**What’s happening?**

* `express.static('public')` serves files under `/` → so `public/index.html` is available at `/`.
* `GET /api/events` reads `data/events.geojson` and responds with JSON.
* `cors()` allows cross‑origin fetches — useful when the page is hosted elsewhere. Safe to leave on for learning.

---

## Frontend (Leaflet)

**public/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Local Events Map</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <h1>Local Events Map</h1>
      <div id="map"></div>
    </main>

    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script src="/app.js" type="module"></script>
  </body>
</html>
```

**public/styles.css** (optional)

```css
:root { font-family: system-ui, sans-serif; }
body { margin: 0; }
main { padding: 1rem; }
#map { height: 70vh; border-radius: 12px; }
```

**public/app.js**

```js
const map = L.map('map').setView([29.4241, -98.4936], 11); // San Antonio default

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

async function loadEvents() {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error('Failed to fetch events');
  const geojson = await res.json();

  // Fit map to data bounds (if any)
  const layer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 8 }),
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      const title = p.title ?? 'Untitled';
      const time = p.datetime ?? ''; // ISO string or human text
      const description = p.description ?? '';
      layer.bindPopup(`<strong>${title}</strong><br>${time}<br>${description}`);
    },
  }).addTo(map);

  try {
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  } catch {}
}

loadEvents().catch(err => console.error(err));
```

---

## Sample data (GeoJSON)

**data/events.geojson**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-98.4936, 29.4241] },
      "properties": {
        "id": "evt-001",
        "title": "Farmers Market",
        "datetime": "2025-10-04T09:00:00-05:00",
        "description": "Fresh produce and local crafts downtown."
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-98.485, 29.43] },
      "properties": {
        "id": "evt-002",
        "title": "Live Music in the Park",
        "datetime": "2025-10-05T18:30:00-05:00",
        "description": "Bring a blanket and enjoy the show!"
      }
    }
  ]
}
```

Key rules:

* Coordinates are `[longitude, latitude]` (x, y) — **not** `[lat, lng]`.
* `FeatureCollection.features` is an array of `Feature` objects.
* Store event metadata under `properties`.

---

## Testing the API

From the Codespace terminal:

```bash
curl -s https://<your-forwarded-url>/api/events | jq '.'
```

Or hit the URL in your browser to see raw JSON.

---

## Common pitfalls & fixes

* **Nothing shows on the map** → Open DevTools Console (F12). Look for fetch errors. Ensure port 3000 is **Public**.
* **CORS error** when hosting the page elsewhere → keep `app.use(cors())` or configure `cors({ origin: 'https://your-site' })`.
* **Wrong coordinate order** → GeoJSON uses `[lng, lat]`.
* **Layer bounds error** → If data is empty, `fitBounds` will throw; that’s why it’s wrapped in `try/catch`.
* **Port already in use** → Another process is running. Stop it or change `PORT`.

---

## How to extend (ideas)

* Add query params: `/api/events?after=2025-10-01&near=-98.49,29.42&radius_km=5` (filter by time and distance).
* Add **POST /api/events** to accept new events (then validate and write back to `events.geojson`).
* Swap static file for a real DB later (e.g., Postgres + PostGIS) — same API shape.
* Add clustering with `Leaflet.markercluster` for dense points.
* Add categories, icons, and a sidebar list synchronized with the map.

---

## Learning checklist

* [ ] I can describe what Express does in a web server.
* [ ] I know what GeoJSON is and why `[lng, lat]` ordering matters.
* [ ] I can explain how a browser fetches `/api/events` and how Leaflet renders it.
* [ ] I can forward a port in Codespaces and share the URL.
* [ ] I can modify `events.geojson` and see the map update.

---

## License

MIT (for learning/demo purposes).
