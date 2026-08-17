"""SQLite helpers for the AgentOS sidecar."""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

_SCHEMA = """
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY,
    source TEXT NOT NULL,
    severity TEXT NOT NULL,
    action TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    time_label TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    reply_draft_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def data_dir() -> Path:
    configured = os.environ.get("AGENTOS_DATA_DIR")
    if configured:
        path = Path(configured)
    else:
        path = Path.home() / ".agentos" / "dev-data"
    path.mkdir(parents=True, exist_ok=True)
    return path


def database_path() -> Path:
    return data_dir() / "agentos.sqlite3"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path(), check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database(connection: sqlite3.Connection) -> None:
    connection.executescript(_SCHEMA)
    connection.commit()
