/**
 * Similarity Algorithms
 * Implements cosine similarity and other vector similarity metrics
 */

import type { VectorEmbedding, CosineSimilarityResult } from '@/types/embeddings';

/**
 * Calculate dot product of two vectors
 */
function dotProduct(a: VectorEmbedding, b: VectorEmbedding): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    if (valA !== undefined && valB !== undefined) {
      result += valA * valB;
    }
  }
  return result;
}

/**
 * Calculate magnitude (L2 norm) of a vector
 */
function magnitude(vector: VectorEmbedding): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    const val = vector[i];
    if (val !== undefined) {
      sum += val * val;
    }
  }
  return Math.sqrt(sum);
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector: VectorEmbedding): VectorEmbedding {
  const mag = magnitude(vector);
  if (mag === 0) {
    return vector;
  }

  return vector.map(value => (value ?? 0) / mag);
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 is identical
 */
export function cosineSimilarity(a: VectorEmbedding, b: VectorEmbedding): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (magA * magB);
}

/**
 * Calculate cosine similarity with detailed result
 */
export function cosineSimilarityDetailed(
  a: VectorEmbedding,
  b: VectorEmbedding,
): CosineSimilarityResult {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  const normA = normalizeVector(a);
  const normB = normalizeVector(b);

  return {
    similarity: dotProduct(normA, normB),
    normalizedVectorA: normA,
    normalizedVectorB: normB,
  };
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a: VectorEmbedding, b: VectorEmbedding): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    if (valA !== undefined && valB !== undefined) {
      const diff = valA - valB;
      sum += diff * diff;
    }
  }
  return Math.sqrt(sum);
}

/**
 * Calculate Manhattan distance between two vectors
 */
export function manhattanDistance(a: VectorEmbedding, b: VectorEmbedding): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    if (valA !== undefined && valB !== undefined) {
      sum += Math.abs(valA - valB);
    }
  }
  return sum;
}

/**
 * Find the most similar vector from a list
 */
export function findMostSimilar(
  query: VectorEmbedding,
  candidates: VectorEmbedding[],
): { index: number; similarity: number } {
  if (candidates.length === 0) {
    throw new Error('Candidate list cannot be empty');
  }

  let bestIndex = 0;
  let bestSimilarity = -Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate !== undefined) {
      const similarity = cosineSimilarity(query, candidate);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestIndex = i;
      }
    }
  }

  return { index: bestIndex, similarity: bestSimilarity };
}

/**
 * Find top K most similar vectors from a list
 */
export function findTopKSimilar(
  query: VectorEmbedding,
  candidates: VectorEmbedding[],
  k: number,
): Array<{ index: number; similarity: number }> {
  if (candidates.length === 0) {
    throw new Error('Candidate list cannot be empty');
  }

  if (k <= 0) {
    return [];
  }

  const results: Array<{ index: number; similarity: number }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate !== undefined) {
      const similarity = cosineSimilarity(query, candidate);
      results.push({ index: i, similarity });
    }
  }

  // Sort by similarity (descending)
  results.sort((a, b) => b.similarity - a.similarity);

  // Return top K
  return results.slice(0, k);
}

/**
 * Calculate similarity threshold for filtering results
 */
export function getSimilarityThreshold(level: 'strict' | 'moderate' | 'lenient'): number {
  switch (level) {
    case 'strict':
      return 0.8; // High similarity required
    case 'moderate':
      return 0.6; // Moderate similarity
    case 'lenient':
      return 0.4; // Low similarity
    default:
      return 0.6;
  }
}
