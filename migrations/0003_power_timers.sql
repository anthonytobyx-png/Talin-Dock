CREATE TABLE IF NOT EXISTS power_timers (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('on', 'off')),
  due_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','claimed','acknowledged','unknown','cancelled','expired'))
);
CREATE INDEX IF NOT EXISTS power_timers_due ON power_timers(status, due_at);
CREATE INDEX IF NOT EXISTS power_timers_created ON power_timers(created_at);
CREATE TABLE IF NOT EXISTS timer_runner (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  last_seen INTEGER NOT NULL,
  config_hash TEXT NOT NULL
);
