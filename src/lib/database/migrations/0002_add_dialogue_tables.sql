-- Migration: Add dialogue tracking tables
-- Created: 2026-01-14

-- Dialogue lines table
CREATE TABLE IF NOT EXISTS dialogue_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  character_id TEXT,
  character_name TEXT NOT NULL,
  text TEXT NOT NULL,
  tag TEXT NOT NULL,
  action TEXT,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dialogue_lines_project ON dialogue_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_lines_chapter ON dialogue_lines(chapter_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_lines_character ON dialogue_lines(character_id);

-- Character voice profiles table
CREATE TABLE IF NOT EXISTS character_voice_profiles (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL UNIQUE,
  character_name TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_lines INTEGER NOT NULL DEFAULT 0,
  speech_pattern TEXT,
  favorite_words TEXT,
  common_tags TEXT,
  voice_consistency_score REAL NOT NULL DEFAULT 0,
  last_analyzed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voice_profiles_project ON character_voice_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_character ON character_voice_profiles(character_id);

-- Dialogue analyses table
CREATE TABLE IF NOT EXISTS dialogue_analyses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id TEXT,
  total_lines INTEGER NOT NULL,
  speaker_distribution TEXT,
  average_line_length REAL NOT NULL,
  tag_distribution TEXT,
  issues TEXT,
  overall_quality_score REAL NOT NULL DEFAULT 0,
  analyzed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dialogue_analyses_project ON dialogue_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_analyses_chapter ON dialogue_analyses(chapter_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  title TEXT,
  participants TEXT,
  turns TEXT,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  average_tension REAL NOT NULL DEFAULT 5,
  dominant_speaker TEXT,
  conversation_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chapter ON conversations(chapter_id);
