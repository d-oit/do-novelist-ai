/**
 * Batch Processor
 * Handles batch processing of content for semantic search
 */

import type { NewVectorRow } from '@/lib/database/schemas';
import { batchCreateVectors } from '@/lib/database/services/vector-service';
import { generateEmbeddings } from '@/lib/embeddings/embedding-service';
import { logger } from '@/lib/logging/logger';
import type { EmbeddingModel, VectorRow } from '@/types/embeddings';

import type { ExtractedContent } from './content-processor';

/**
 * Maximum number of items per batch for embedding generation
 */
export const EMBEDDING_BATCH_SIZE = 100;

/**
 * Process a batch of extracted content and store as vectors
 */
export async function processBatch(
  contents: ExtractedContent[],
  model: EmbeddingModel = 'text-embedding-3-small',
): Promise<VectorRow[]> {
  if (contents.length === 0) {
    return [];
  }

  try {
    logger.info('Starting batch processing', { count: contents.length, model });

    // Split into smaller batches if needed
    const allResults: VectorRow[] = [];
    for (let i = 0; i < contents.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = contents.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = batch.map(c => c.content);

      // 1. Generate embeddings for the batch
      const { embeddings } = await generateEmbeddings(texts, model);

      // 2. Map embeddings back to content
      const vectorContents = batch.map((content, index) => ({
        ...content,
        embedding: embeddings[index],
      }));

      // 3. Store vectors in database
      // Note: vector-service's batchCreateVectors currently calls getOrCreateVector in a loop
      // We should probably optimize it later to do a single transaction if needed,
      // but for now we follow the existing pattern for safety.
      const results = await batchCreateVectors(vectorContents as unknown as NewVectorRow[], model);
      allResults.push(...results);
    }

    logger.info('Batch processing completed', { totalProcessed: allResults.length });
    return allResults;
  } catch (error) {
    logger.error('Batch processing failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Update embeddings for multiple items
 */
export async function updateEmbeddingsBatch(
  contents: ExtractedContent[],
  model: EmbeddingModel = 'text-embedding-3-small',
): Promise<VectorRow[]> {
  // Currently reuse processBatch as it uses getOrCreateVector which handles updates if logically combined
  // but vector-service.ts actually has updateVector.
  // For a pure update batch, we might want a separate implementation if we want to ensure they exist.
  // In most cases, processBatch is sufficient for synchronization.
  return processBatch(contents, model);
}
