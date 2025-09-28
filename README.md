# Local Events Map API — DuckDB Edition

This mini-project now stores its event feed in a **DuckDB** database. A Python seeding script generates realistic sample events, and an **Express** API exposes them as GeoJSON to a **Leaflet** front-end. Everything still runs entirely inside **GitHub Codespaces**—no external services required. Public url to website can be found here: https://vigilant-computing-machine-rwjjw679wjr35qjx-3000.app.github.dev/

---

## What you’ll build

* A REST-style endpoint: `GET /api/events` → pulls rows from DuckDB and returns a GeoJSON `FeatureCollection`.
* A static Leaflet page (`/`) that fetches the API and renders markers with popups.
* A Python utility (`scripts/seed_duckdb.py`) that fills `data/events.duckdb` with randomized sample events.

<p align="center"><em>Flow</em>: Python seeds DuckDB → Express queries DuckDB → Browser fetches `/api/events` → Leaflet renders the map</p>

---

## Tech Primer

**Node.js / Express** — HTTP server that serves both the API and static assets.
**DuckDB** — Embedded analytics database stored in a single file (`data/events.duckdb`).
**Python** — Used to generate fake events and load them into DuckDB.
**Leaflet** — Lightweight JS mapping library used on the front-end.
**GeoJSON** — Standard JSON shape for geographical features; Leaflet reads it directly.

> Mental model: the Python script preps a fridge full of ingredients (events) inside DuckDB. Express is the cook that plates the right rows as GeoJSON when the browser asks for `/api/events`, and Leaflet serves it to the map.

---

## Repository structure

```
.
├── package.json
├── package-lock.json
├── server.js                 # Express server that queries DuckDB
├── scripts/
│   └── seed_duckdb.py        # Python script that populates DuckDB with fake events
├── data/
│   └── events.duckdb         # DuckDB database file
└── public/
    ├── index.html            # Leaflet map page
    ├── app.js                # Fetches /api/events and adds markers
    └── styles.css
```

---

## Quickstart (GitHub Codespaces)

1. **Create the Codespace**: GitHub → “Code” → *Create codespace on main*.
2. **Install Node deps** (first run):
   ```bash
   npm install
   ```
3. **Create a Python virtualenv** (optional but recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. **Seed DuckDB with sample data**:
   ```bash
   python scripts/seed_duckdb.py
   ```
   This writes ~24 randomized events into `data/events.duckdb`. Re-run anytime you want fresh data.
5. **Run the server**:
   ```bash
   npm run dev
   ```
   Express starts on port **3000** with hot reload via `nodemon`.
6. **Expose the port**: In Codespaces “Ports” panel forward **3000** and set it to **Public**.
7. **Open the app**: Visit the forwarded URL to see the Leaflet map. The API lives at `<url>/api/events`.

---

## Server (Express + DuckDB)

**server.js** (conceptual snippet):

```js
import duckdb from 'duckdb';
const db = new duckdb.Database('data/events.duckdb', { readonly: true });
const conn = db.connect();

app.get('/api/events', async (req, res) => {
  const rows = await queryEvents(conn);
  res.json(rowsToGeoJSON(rows));
});
```

* `queryEvents` runs `SELECT id, title, starts_at, description, latitude, longitude FROM events ORDER BY starts_at`.
* `rowsToGeoJSON` maps each row into a GeoJSON `Feature` (DuckDB stores timestamps; the server emits ISO strings so the map can display them nicely).

---

## Seeding data with Python

Run `python scripts/seed_duckdb.py` to (re)build the database. The script:

* Creates the `events` table if it does not exist.
* Wipes any previous rows (`DELETE FROM events`).
* Generates 24 events around downtown San Antonio with randomized titles, times (within the next 30 days), and marker positions.

Want to customize? Edit `EVENT_TOPICS`, `DESCRIPTIONS`, or tweak how timestamps and coordinates are generated.

---

## Testing the API

From any shell:

```bash
curl -s https://<forwarded-url>/api/events | jq '.'
```

Or hit the URL in the browser to inspect raw JSON.

---

## Common pitfalls & fixes

* **DuckDB file missing** → run `python scripts/seed_duckdb.py` before starting the server.
* **"Cannot open database" error** → ensure the Node process has read access to `data/events.duckdb`.
* **Nothing on the map** → check DevTools console for fetch errors. Confirm port 3000 is public.
* **CORS errors** → When hosting the frontend elsewhere, leave `app.use(cors())` enabled or configure allowed origins.
* **Timestamp weirdness** → DuckDB stores timestamps with timezone. If you customize the schema, keep them convertible to ISO strings for the front-end.

---

## How to extend

* Add new columns (e.g., `category`, `price`) in DuckDB and surface them on the map.
* Accept parameters like `/api/events?after=2025-10-01` and filter directly in SQL.
* Explore DuckDB’s spatial extension to store geometry columns instead of raw lat/lng.
* Swap the Python script for real ingestion (CSV import, APIs, etc.).

---

## License

MIT — Happy mapping!
