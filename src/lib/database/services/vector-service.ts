/**
 * Vector Service
 * Manages vector embeddings in the database
 * Provides CRUD operations and similarity search
 */

import { eq, and, desc, sql } from 'drizzle-orm';

import { getDrizzleClient, schema } from '@/lib/database/drizzle';
import type { NewVectorRow } from '@/lib/database/schemas/vectors';
import { generateEmbedding } from '@/lib/embeddings/embedding-service';
import { cosineSimilarity } from '@/lib/embeddings/similarity';
import { logger } from '@/lib/logging/logger';
import type {
  VectorContent,
  VectorEmbedding,
  VectorRow,
  VectorEntityType,
  SimilaritySearchRequest,
  SimilaritySearchResult,
} from '@/types/embeddings';

/**
 * Parse vector embedding from JSON string
 */
function parseEmbedding(embeddingString: string): VectorEmbedding {
  try {
    return JSON.parse(embeddingString) as VectorEmbedding;
  } catch (error) {
    logger.error('Failed to parse embedding', { error });
    return [];
  }
}

/**
 * Serialize vector embedding to JSON string
 */
function serializeEmbedding(embedding: VectorEmbedding): string {
  return JSON.stringify(embedding);
}

/**
 * Get or create vector for content
 */
export async function getOrCreateVector(
  content: VectorContent,
  model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small',
): Promise<VectorRow> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  // Check if vector already exists
  const existing = await db
    .select()
    .from(schema.vectors)
    .where(
      and(
        eq(schema.vectors.projectId, content.projectId),
        eq(schema.vectors.entityType, content.entityType),
        eq(schema.vectors.entityId, content.entityId),
      ),
    )
    .limit(1);

  if (existing.length > 0 && existing[0] !== undefined) {
    return existing[0];
  }

  // Generate new embedding
  const embedding = await generateEmbedding(content.content, model);
  const dimensions = embedding.length;

  // Create vector record
  const newVector: NewVectorRow = {
    id: crypto.randomUUID(),
    projectId: content.projectId,
    entityType: content.entityType,
    entityId: content.entityId,
    content: content.content,
    embedding: serializeEmbedding(embedding),
    dimensions,
    model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await db.insert(schema.vectors).values(newVector).returning();

  logger.info('Created vector embedding', {
    projectId: content.projectId,
    entityType: content.entityType,
    entityId: content.entityId,
    dimensions,
  });

  if (result[0] === undefined) {
    throw new Error('Failed to create vector');
  }

  return result[0];
}

/**
 * Update vector embedding for existing content
 */
export async function updateVector(
  content: VectorContent,
  model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small',
): Promise<VectorRow> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  // Generate new embedding
  const embedding = await generateEmbedding(content.content, model);
  const dimensions = embedding.length;

  // Update vector record
  const result = await db
    .update(schema.vectors)
    .set({
      content: content.content,
      embedding: serializeEmbedding(embedding),
      dimensions,
      model,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(schema.vectors.projectId, content.projectId),
        eq(schema.vectors.entityType, content.entityType),
        eq(schema.vectors.entityId, content.entityId),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error('Vector not found');
  }

  logger.info('Updated vector embedding', {
    projectId: content.projectId,
    entityType: content.entityType,
    entityId: content.entityId,
  });

  if (result[0] === undefined) {
    throw new Error('Failed to update vector');
  }

  return result[0];
}

/**
 * Delete vector
 */
export async function deleteVector(
  projectId: string,
  entityType: VectorEntityType,
  entityId: string,
): Promise<void> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  await db
    .delete(schema.vectors)
    .where(
      and(
        eq(schema.vectors.projectId, projectId),
        eq(schema.vectors.entityType, entityType),
        eq(schema.vectors.entityId, entityId),
      ),
    );

  logger.info('Deleted vector embedding', {
    projectId,
    entityType,
    entityId,
  });
}

/**
 * Get vector by project and entity
 */
export async function getVector(
  projectId: string,
  entityType: VectorEntityType,
  entityId: string,
): Promise<VectorRow | null> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db
    .select()
    .from(schema.vectors)
    .where(
      and(
        eq(schema.vectors.projectId, projectId),
        eq(schema.vectors.entityType, entityType),
        eq(schema.vectors.entityId, entityId),
      ),
    )
    .limit(1);

  return result.length > 0 && result[0] !== undefined ? result[0] : null;
}

/**
 * Get all vectors for a project
 */
export async function getVectorsForProject(projectId: string): Promise<VectorRow[]> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  return db.select().from(schema.vectors).where(eq(schema.vectors.projectId, projectId));
}

/**
 * Get vectors by entity type
 */
export async function getVectorsByType(
  projectId: string,
  entityType: VectorEntityType,
): Promise<VectorRow[]> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  return db
    .select()
    .from(schema.vectors)
    .where(and(eq(schema.vectors.projectId, projectId), eq(schema.vectors.entityType, entityType)));
}

/**
 * Perform semantic similarity search
 */
export async function semanticSearch(
  request: SimilaritySearchRequest,
): Promise<SimilaritySearchResult[]> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(request.queryText);
  const threshold = request.threshold ?? 0.4;
  const limit = request.limit ?? 10;

  // Build query conditions
  const conditions = request.projectId ? eq(schema.vectors.projectId, request.projectId) : sql`1=1`;
  const typeCondition = request.entityType
    ? eq(schema.vectors.entityType, request.entityType)
    : sql`1=1`;

  // Fetch candidate vectors
  const candidates = await db
    .select()
    .from(schema.vectors)
    .where(and(conditions, typeCondition))
    .orderBy(desc(schema.vectors.updatedAt));

  // Calculate similarities
  const results: SimilaritySearchResult[] = [];

  for (const candidate of candidates) {
    const embedding = parseEmbedding(candidate.embedding);

    if (embedding.length === 0) {
      continue;
    }

    const similarity = cosineSimilarity(queryEmbedding, embedding);

    if (similarity >= threshold) {
      results.push({
        id: candidate.id,
        projectId: candidate.projectId,
        entityType: candidate.entityType,
        entityId: candidate.entityId,
        content: candidate.content,
        similarity,
      });
    }
  }

  // Sort by similarity (descending) and limit
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, limit);
}

/**
 * Batch create vectors
 */
export async function batchCreateVectors(
  contents: VectorContent[],
  model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small',
): Promise<VectorRow[]> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  const results: VectorRow[] = [];

  for (const content of contents) {
    const vector = await getOrCreateVector(content, model);
    results.push(vector);
  }

  logger.info('Batch created vectors', { count: contents.length });

  return results;
}

/**
 * Count vectors for a project
 */
export async function countVectorsForProject(projectId: string): Promise<number> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.vectors)
    .where(eq(schema.vectors.projectId, projectId));

  return result[0]?.count ?? 0;
}

/**
 * Check if vector exists
 */
export async function vectorExists(
  projectId: string,
  entityType: VectorEntityType,
  entityId: string,
): Promise<boolean> {
  const db = getDrizzleClient();

  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db
    .select({ id: schema.vectors.id })
    .from(schema.vectors)
    .where(
      and(
        eq(schema.vectors.projectId, projectId),
        eq(schema.vectors.entityType, entityType),
        eq(schema.vectors.entityId, entityId),
      ),
    )
    .limit(1);

  return result.length > 0;
}
