-- Add author and author_avatar columns to parse_history
ALTER TABLE parse_history ADD COLUMN author TEXT;
ALTER TABLE parse_history ADD COLUMN author_avatar TEXT;
