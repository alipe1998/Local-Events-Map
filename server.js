import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/events', async (req, res) => {
  const filePath = path.join(__dirname, 'data', 'events.geojson');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const geojson = JSON.parse(fileContents);
    res.json(geojson);
  } catch (error) {
    console.error('Failed to read events data:', error);
    res.status(500).json({ error: 'Unable to load events data' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
