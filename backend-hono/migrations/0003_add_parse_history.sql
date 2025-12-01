-- Create parse_history table
CREATE TABLE IF NOT EXISTS parse_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  cover_url TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_parse_history_user_id ON parse_history(user_id);
