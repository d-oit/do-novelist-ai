-- Migration: Add vectors table for semantic search
-- Created: January 4, 2026
-- Description: Stores vector embeddings for similarity search

CREATE TABLE IF NOT EXISTS vectors (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('chapter', 'character', 'world_building', 'project')),
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now'))
);

-- Create index for faster project queries
CREATE INDEX IF NOT EXISTS idx_vectors_project_id ON vectors(project_id);

-- Create index for entity type queries
CREATE INDEX IF NOT EXISTS idx_vectors_entity_type ON vectors(entity_type);

-- Create index for composite queries (project + entity type)
CREATE INDEX IF NOT EXISTS idx_vectors_project_entity ON vectors(project_id, entity_type);
