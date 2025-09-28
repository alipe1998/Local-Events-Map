import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import duckdb from 'duckdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'data', 'events.duckdb');
const db = new duckdb.Database(dbPath);
const connection = db.connect();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

function rowsToGeoJSON(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.map((row) => {
      const { id, title, starts_at, description, latitude, longitude } = row;
      let isoTimestamp = '';

      if (starts_at) {
        if (starts_at instanceof Date) {
          isoTimestamp = starts_at.toISOString();
        } else {
          try {
            isoTimestamp = new Date(starts_at).toISOString();
          } catch (error) {
            console.warn('Unable to parse timestamp for row', id, error);
            isoTimestamp = String(starts_at);
          }
        }
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
        },
        properties: {
          id,
          title,
          datetime: isoTimestamp,
          description: description ?? '',
        },
      };
    }),
  };
}

function queryEvents() {
  return new Promise((resolve, reject) => {
    connection.all(
      'SELECT id, title, starts_at, description, latitude, longitude FROM events ORDER BY starts_at',
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      },
    );
  });
}

app.get('/api/events', async (req, res) => {
  try {
    const rows = await queryEvents();
    res.json(rowsToGeoJSON(rows));
  } catch (error) {
    console.error('Failed to read events from DuckDB:', error);
    res.status(500).json({ error: 'Unable to load events data' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
