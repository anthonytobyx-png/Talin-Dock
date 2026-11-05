CREATE TABLE IF NOT EXISTS computers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('Windows','macOS')),
  token_hash TEXT NOT NULL UNIQUE,
  snapshot TEXT,
  last_seen INTEGER NOT NULL DEFAULT 0,
  active_until INTEGER NOT NULL DEFAULT 0,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS computer_commands (
  id TEXT PRIMARY KEY,
  computer_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','claimed','acknowledged','failed','unknown','expired')),
  result TEXT
);
CREATE INDEX IF NOT EXISTS computer_commands_pending ON computer_commands(computer_id,status,created_at);
