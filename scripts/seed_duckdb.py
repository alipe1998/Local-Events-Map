#!/usr/bin/env python3
"""Seed the DuckDB database with synthetic event data."""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "events.duckdb"

CENTER_LAT = 29.4241
CENTER_LNG = -98.4936

EVENT_TOPICS = [
    "Farmers Market",
    "Live Music",
    "Tech Meetup",
    "Art Walk",
    "Food Truck Rally",
    "Community Yoga",
    "Book Club",
    "Outdoor Movie",
    "Charity Run",
    "Craft Fair",
]

DESCRIPTIONS = [
    "Local vendors, seasonal produce, and handmade goods.",
    "An evening of performances from neighborhood artists.",
    "Talks, demos, and networking with fellow builders.",
    "Gallery crawl featuring emerging creators.",
    "A rotation of the city's favorite food trucks.",
    "Sunrise flow for all levels. Bring your own mat.",
    "Discussing the latest reads over coffee.",
    "Family-friendly screening under the stars.",
    "5K/10K routes followed by a block party.",
    "DIY workshops and pop-up boutique stalls.",
]


def generate_events(count: int = 24) -> list[tuple[str, str, str, str, float, float]]:
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    events: list[tuple[str, str, str, str, float, float]] = []

    for _ in range(count):
        topic = random.choice(EVENT_TOPICS)
        title = f"{topic} #{random.randint(1, 25)}"
        start_at = now + timedelta(days=random.randint(0, 30), hours=random.randint(1, 12))
        description = random.choice(DESCRIPTIONS)
        latitude = CENTER_LAT + random.uniform(-0.045, 0.045)
        longitude = CENTER_LNG + random.uniform(-0.045, 0.045)
        events.append(
            (
                str(uuid.uuid4()),
                title,
                start_at.isoformat(),
                description,
                latitude,
                longitude,
            )
        )

    return events


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(DB_PATH)

    con.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            starts_at TIMESTAMP NOT NULL,
            description TEXT,
            latitude DOUBLE NOT NULL,
            longitude DOUBLE NOT NULL
        )
        """
    )

    con.execute("DELETE FROM events")

    payload = generate_events()
    con.executemany(
        "INSERT INTO events (id, title, starts_at, description, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)",
        payload,
    )

    con.close()
    print(f"Seeded {len(payload)} events into {DB_PATH}")


if __name__ == "__main__":
    main()
