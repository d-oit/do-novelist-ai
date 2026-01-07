/**
 * Semantic Search Sync Service
 *
 * Manages the synchronization between content changes (Editor, Characters, World Building)
 * and the vector database for semantic search.
 */

import * as vectorService from '@/lib/database/services/vector-service';
import { logger } from '@/lib/logging/logger';

import * as contentProcessor from './content-processor';
import { queryCache } from './query-cache';

interface WorldBuildingElement {
  id: string;
  type: string;
  name: string;
  description?: string;
  details?: string;
}

class SemanticSyncService {
  private updateQueue: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 2000; // Debounce updates to avoid excessive API calls

  /**
   * Sync chapter content
   */
  public async syncChapter(
    projectId: string,
    chapterId: string,
    content: string,
    title?: string,
    summary?: string,
  ): Promise<void> {
    const debouncedKey = `chapter:${chapterId}`;

    // Cancel existing pending update for this chapter
    if (this.updateQueue.has(debouncedKey)) {
      clearTimeout(this.updateQueue.get(debouncedKey));
    }

    // Schedule new update
    const timeout = setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          const extracted = contentProcessor.extractFromChapter(projectId, {
            id: chapterId,
            content,
            title: title || '',
            summary: summary || '',
          });

          await this.processContents(extracted);
          this.updateQueue.delete(debouncedKey);
        } catch (error) {
          logger.error('Failed to sync chapter embeddings', { chapterId, error });
        }
      })();
    }, this.DEBOUNCE_MS);

    this.updateQueue.set(debouncedKey, timeout);
  }

  /**
   * Sync character content
   */
  public async syncCharacter(
    projectId: string,
    character: { id: string; name: string; description?: string; backstory?: string },
  ): Promise<void> {
    const debouncedKey = `character:${character.id}`;

    if (this.updateQueue.has(debouncedKey)) {
      clearTimeout(this.updateQueue.get(debouncedKey));
    }

    const timeout = setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          const extracted = contentProcessor.extractFromCharacter(projectId, character);
          await this.processContents(extracted);
          this.updateQueue.delete(debouncedKey);
        } catch (error) {
          logger.error('Failed to sync character embeddings', { characterId: character.id, error });
        }
      })();
    }, this.DEBOUNCE_MS);

    this.updateQueue.set(debouncedKey, timeout);
  }

  /**
   * Sync world building content (Location)
   */
  public async syncLocation(projectId: string, location: WorldBuildingElement): Promise<void> {
    const debouncedKey = `location:${location.id}`;

    if (this.updateQueue.has(debouncedKey)) {
      clearTimeout(this.updateQueue.get(debouncedKey));
    }

    const timeout = setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          const extracted = contentProcessor.extractFromWorldBuilding(projectId, location);
          await this.processContents(extracted);
          this.updateQueue.delete(debouncedKey);
        } catch (error) {
          logger.error('Failed to sync location embeddings', { locationId: location.id, error });
        }
      })();
    }, this.DEBOUNCE_MS);

    this.updateQueue.set(debouncedKey, timeout);
  }

  /**
   * Sync world building content (Culture)
   */
  public async syncCulture(projectId: string, culture: WorldBuildingElement): Promise<void> {
    const debouncedKey = `culture:${culture.id}`;

    if (this.updateQueue.has(debouncedKey)) {
      clearTimeout(this.updateQueue.get(debouncedKey));
    }

    const timeout = setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          const extracted = contentProcessor.extractFromWorldBuilding(projectId, culture);
          await this.processContents(extracted);
          this.updateQueue.delete(debouncedKey);
        } catch (error) {
          logger.error('Failed to sync culture embeddings', { cultureId: culture.id, error });
        }
      })();
    }, this.DEBOUNCE_MS);

    this.updateQueue.set(debouncedKey, timeout);
  }

  /**
   * Sync project metadata
   */
  public async syncProject(
    projectId: string,
    project: { title: string; idea: string; style?: string; language?: string },
  ): Promise<void> {
    const debouncedKey = `project:${projectId}`;

    if (this.updateQueue.has(debouncedKey)) {
      clearTimeout(this.updateQueue.get(debouncedKey));
    }

    const timeout = setTimeout((): void => {
      void (async (): Promise<void> => {
        try {
          const extracted = contentProcessor.extractFromProject(projectId, project);
          await this.processContents(extracted);
          this.updateQueue.delete(debouncedKey);
        } catch (error) {
          logger.error('Failed to sync project embeddings', { projectId, error });
        }
      })();
    }, this.DEBOUNCE_MS);

    this.updateQueue.set(debouncedKey, timeout);
  }

  /**
   * Process and store extracted contents
   */
  private async processContents(contents: contentProcessor.ExtractedContent[]): Promise<void> {
    const projectIds = new Set<string>();

    for (const content of contents) {
      try {
        // Get existing vector or create if missing
        const vector = await vectorService.getOrCreateVector(content);

        // Check for content changes (delta detection)
        if (vector.content !== content.content) {
          logger.debug('Content changed, updating vector embedding', {
            entityType: content.entityType,
            entityId: content.entityId,
            oldLength: vector.content.length,
            newLength: content.content.length,
          });

          await vectorService.updateVector(content);

          // Track project for cache invalidation
          projectIds.add(content.projectId);

          // Invalidate cache for this entity
          queryCache.invalidateEntity(content.entityId, content.projectId);
        } else {
          logger.debug('Content unchanged, skipping vector update', {
            entityType: content.entityType,
            entityId: content.entityId,
          });
        }
      } catch (error) {
        logger.error('Failed to process content for embedding', {
          entityType: content.entityType,
          entityId: content.entityId,
          error,
        });
      }
    }

    // Log cache invalidation summary
    if (projectIds.size > 0) {
      logger.info('Cache invalidated after content sync', {
        projectCount: projectIds.size,
        contentCount: contents.length,
      });
    }
  }
}

export const semanticSyncService = new SemanticSyncService();
