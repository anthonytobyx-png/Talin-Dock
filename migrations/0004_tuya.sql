CREATE TABLE IF NOT EXISTS tuya_connections (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  encrypted TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  lease_until INTEGER NOT NULL DEFAULT 0,
  snapshot TEXT,
  snapshot_at INTEGER
);
CREATE TABLE IF NOT EXISTS tuya_pairings (
  id TEXT PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  encrypted TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS tuya_pairings_created ON tuya_pairings(created_at);
CREATE TABLE IF NOT EXISTS tuya_commands (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS tuya_commands_created ON tuya_commands(created_at);
