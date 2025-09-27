const map = L.map('map').setView([29.4241, -98.4936], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

async function loadEvents() {
  const statusEl = document.createElement('div');
  statusEl.className = 'sr-only';
  statusEl.textContent = 'Loading events...';
  document.body.appendChild(statusEl);

  try {
    const res = await fetch('/api/events');
    if (!res.ok) {
      throw new Error(`Failed to fetch events: ${res.status}`);
    }

    const geojson = await res.json();
    const layer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 8,
          color: '#2563eb',
          weight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.8,
        }),
      onEachFeature: (feature, leafletLayer) => {
        const props = feature.properties || {};
        const title = props.title ?? 'Untitled Event';
        const time = props.datetime ? new Date(props.datetime).toLocaleString() : '';
        const description = props.description ?? '';

        leafletLayer.bindPopup(
          `<strong>${title}</strong><br />${time}<br />${description}`
        );
      },
    }).addTo(map);

    try {
      map.fitBounds(layer.getBounds(), { padding: [24, 24] });
    } catch (error) {
      console.warn('Unable to fit bounds:', error);
    }
  } catch (error) {
    console.error(error);
    alert('Unable to load events. Please try again later.');
  } finally {
    statusEl.remove();
  }
}

loadEvents();
