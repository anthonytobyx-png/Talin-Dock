CREATE TABLE IF NOT EXISTS alexa_commands (
  request_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('on', 'off')),
  created_at INTEGER NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS alexa_commands_created ON alexa_commands(created_at);
