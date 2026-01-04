/**
 * Types for embedding generation and vector operations
 */

/**
 * Supported embedding models
 */
export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  model: EmbeddingModel;
  dimensions: number;
  maxTokens: number;
  costPer1MInputTokens: number;
}

/**
 * Embedding models configuration
 */
export const EMBEDDING_MODELS: Record<EmbeddingModel, EmbeddingModelConfig> = {
  'text-embedding-3-small': {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1MInputTokens: 0.02,
  },
  'text-embedding-3-large': {
    model: 'text-embedding-3-large',
    dimensions: 3072,
    maxTokens: 8191,
    costPer1MInputTokens: 0.13,
  },
};

/**
 * Vector embedding representation
 */
export type VectorEmbedding = number[];

/**
 * Embedding request interface
 */
export interface EmbeddingRequest {
  texts: string[];
  model: EmbeddingModel;
}

/**
 * Embedding response interface
 */
export interface EmbeddingResponse {
  embeddings: VectorEmbedding[];
  model: EmbeddingModel;
  dimensions: number;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Entity types that can be vectorized for semantic search
 */
export type VectorEntityType = 'chapter' | 'character' | 'world_building' | 'project';

/**
 * Content to be vectorized
 */
export interface VectorContent {
  projectId: string;
  entityType: VectorEntityType;
  entityId: string;
  content: string;
}

/**
 * Database representation of a vector
 */
export interface VectorRow {
  id: string;
  projectId: string;
  entityType: VectorEntityType;
  entityId: string;
  content: string;
  embedding: string;
  dimensions: number;
  model: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  embeddings: VectorEmbedding[];
  cost: number;
  tokenCount: number;
}

/**
 * Similarity search request
 */
export interface SimilaritySearchRequest {
  projectId?: string;
  queryText: string;
  entityType?: 'chapter' | 'character' | 'world_building' | 'project';
  limit?: number;
  threshold?: number; // Minimum similarity score (0-1)
  includeContent?: boolean;
}

/**
 * Similarity search result
 */
export interface SimilaritySearchResult {
  id: string;
  projectId: string;
  entityType: VectorEntityType;
  entityId: string;
  content: string;
  similarity: number;
}

/**
 * Cosine similarity result
 */
export interface CosineSimilarityResult {
  similarity: number;
  normalizedVectorA: VectorEmbedding;
  normalizedVectorB: VectorEmbedding;
}

/**
 * Common fields for searchable entities to avoid 'any' casting
 */
export interface SearchableEntity {
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  content?: string;
}

/**
 * Hydrated search result with full entity data
 */
export interface HydratedSearchResult extends SimilaritySearchResult {
  entity: SearchableEntity; // Improved type for hydrated data
  context: string; // Formatting context for RAG
}

export interface SearchFilters {
  entityTypes?: VectorEntityType[];
  minScore?: number;
  limit?: number;
}
