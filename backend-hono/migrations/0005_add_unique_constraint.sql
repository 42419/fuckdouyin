-- Create unique index to prevent duplicate history entries for the same user and video
CREATE UNIQUE INDEX IF NOT EXISTS idx_parse_history_user_video ON parse_history(user_id, video_url);
