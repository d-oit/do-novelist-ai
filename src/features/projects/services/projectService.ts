/**
 * Project Service
 *
 * Handles project persistence using ProjectRepository
 */

import { semanticSyncService } from '@/features/semantic-search';
import { logger } from '@/lib/logging/logger';
import { ProjectRepository } from '@/lib/repositories/implementations/ProjectRepository';
import type { IProjectRepository } from '@/lib/repositories/interfaces/IProjectRepository';
import { PublishStatus } from '@/types';
import {
  type Project,
  type Language,
  type ProjectCreationData,
  type ProjectUpdateData,
} from '@/types';

class ProjectService {
  private repository: IProjectRepository;

  constructor(repository?: IProjectRepository) {
    this.repository = repository ?? new ProjectRepository();
  }

  /**
   * Initialize the Project Service
   *
   * Initializes the service and its underlying repository. This is a no-op operation
   * as the repository handles initialization internally.
   *
   * @returns Promise that resolves when initialization is complete
   * @example
   * await projectService.init();
   */
  public async init(): Promise<void> {
    logger.debug('Project Service initialized', { component: 'ProjectService' });
  }

  /**
   * Get all projects
   *
   * Retrieves all projects from the database.
   *
   * @returns Array of all projects
   * @throws {RepositoryError} When database query fails
   * @example
   * const projects = await projectService.getAll();
   * console.log(`Found ${projects.length} projects`);
   */
  public async getAll(): Promise<Project[]> {
    logger.debug('Fetching all projects', { component: 'ProjectService' });
    const projects = await this.repository.findAll();

    logger.info('Retrieved all projects', { component: 'ProjectService', count: projects.length });
    return projects;
  }

  /**
   * Get project by ID
   *
   * Retrieves a specific project by its unique identifier.
   *
   * @param id - The unique project identifier
   * @returns The project if found, or null if not found
   * @throws {RepositoryError} When database query fails
   * @example
   * const project = await projectService.getById('123e4567-e89b-12d3-a456-426614174000');
   * if (project) {
   *   console.log(`Found project: ${project.title}`);
   * } else {
   *   console.log('Project not found');
   * }
   */
  public async getById(id: string): Promise<Project | null> {
    logger.debug('Fetching project by ID', { component: 'ProjectService', projectId: id });
    const project = await this.repository.findById(id);

    if (!project) {
      // Only log as debug in test environment to avoid noise
      if (import.meta.env.NODE_ENV !== 'test') {
        logger.warn('Project not found', { component: 'ProjectService', projectId: id });
      } else {
        logger.debug('Project not found', { component: 'ProjectService', projectId: id });
      }
    }

    return project;
  }

  /**
   * Create new project
   *
   * Creates a new project with the provided data. Automatically initializes:
   * - Unique ID and timestamps
   * - Default world state
   * - Empty timeline structure
   * - Default analytics
   *
   * Side effects:
   * - Writes to database
   * - Triggers semantic search synchronization (async, non-blocking)
   *
   * @param data - Project creation data
   * @returns The newly created project with generated ID
   * @throws {RepositoryError} When database write fails
   * @example
   * const project = await projectService.create({
   *   title: 'The Last Algorithm',
   *   idea: 'A story about AI gaining consciousness',
   *   style: 'Thriller',
   *   genre: ['Science Fiction'],
   *   language: 'en',
   *   targetWordCount: 80000
   * });
   * console.log(`Created project with ID: ${project.id}`);
   */
  public async create(data: ProjectCreationData): Promise<Project> {
    logger.info('Creating new project', { component: 'ProjectService', title: data.title });

    const now = Date.now();
    const projectId = crypto.randomUUID();
    const projectData: Omit<Project, 'id'> = {
      title: data.title,
      idea: data.idea,
      style: data.style,
      status: PublishStatus.DRAFT,
      chapters: [],
      coverImage: '',
      createdAt: new Date(now),
      updatedAt: new Date(now),
      worldState: {
        hasTitle: true,
        hasOutline: false,
        chaptersCount: 0,
        chaptersCompleted: 0,
        styleDefined: true,
        isPublished: false,
        hasCharacters: false,
        hasWorldBuilding: false,
        hasThemes: false,
        plotStructureDefined: false,
        targetAudienceDefined: false,
      },
      isGenerating: false,
      language: (data.language ?? 'en') as Language,
      targetWordCount: data.targetWordCount ?? 50000,
      settings: {
        enableDropCaps: true,
      },
      genre: data.genre ?? [],
      targetAudience: (data.targetAudience ?? 'adult') as
        | 'children'
        | 'young_adult'
        | 'adult'
        | 'all_ages',
      contentWarnings: [],
      keywords: [],
      synopsis: '',
      authors: [],
      analytics: {
        totalWordCount: 0,
        averageChapterLength: 0,
        estimatedReadingTime: 0,
        generationCost: 0,
        editingRounds: 0,
      },
      version: '1.0.0',
      changeLog: [],
      timeline: {
        id: crypto.randomUUID(),
        projectId: projectId,
        events: [],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      },
    };

    const project = await this.repository.create(projectData);
    semanticSyncService.syncProject(project.id, project).catch(error => {
      logger.warn('Failed to sync project embedding', { error });
    });
    logger.info('Project created successfully', {
      component: 'ProjectService',
      projectId: project.id,
    });
    return project;
  }

  /**
   * Update project
   *
   * Updates specific fields of an existing project.
   *
   * Side effects:
   * - Updates updatedAt timestamp
   * - Triggers semantic search synchronization (async, non-blocking)
   *
   * @param id - The unique project identifier
   * @param data - Partial project data to update
   * @throws {Error} When project is not found
   * @throws {RepositoryError} When database write fails
   * @example
   * await projectService.update('123e4567-e89b-12d3-a456-426614174000', {
   *   title: 'Updated Title',
   *   synopsis: 'Updated synopsis text'
   * });
   */
  public async update(id: string, data: ProjectUpdateData): Promise<void> {
    logger.debug('Updating project', { component: 'ProjectService', projectId: id });

    const updated = await this.repository.update(id, data);
    if (!updated) {
      const error = new Error(`Project not found: ${id}`);
      if (import.meta.env.NODE_ENV !== 'test') {
        logger.error('Failed to update project: not found', {
          component: 'ProjectService',
          projectId: id,
        });
      }
      throw error;
    }

    semanticSyncService.syncProject(id, updated).catch(error => {
      logger.warn('Failed to sync project embedding', { error });
    });
    logger.info('Project updated successfully', { component: 'ProjectService', projectId: id });
  }

  /**
   * Delete project
   *
   * Permanently removes a project from the database.
   *
   * @param id - The unique project identifier
   * @throws {RepositoryError} When database deletion fails
   * @example
   * await projectService.delete('123e4567-e89b-12d3-a456-426614174000');
   * console.log('Project deleted');
   */
  public async delete(id: string): Promise<void> {
    if (import.meta.env.NODE_ENV !== 'test') {
      logger.warn('Deleting project', { component: 'ProjectService', projectId: id });
    } else {
      logger.debug('Deleting project', { component: 'ProjectService', projectId: id });
    }

    await this.repository.delete(id);

    if (import.meta.env.NODE_ENV !== 'test') {
      logger.info('Project deleted', { component: 'ProjectService', projectId: id });
    } else {
      logger.debug('Project deleted', { component: 'ProjectService', projectId: id });
    }
  }

  /**
   * Get projects by status
   *
   * Retrieves all projects with a specific publication status.
   *
   * @param status - The publication status to filter by
   * @returns Array of projects matching the status
   * @throws {RepositoryError} When database query fails
   * @example
   * const drafts = await projectService.getByStatus(PublishStatus.DRAFT);
   * console.log(`Found ${drafts.length} draft projects`);
   */
  public async getByStatus(status: PublishStatus): Promise<Project[]> {
    logger.debug('Fetching projects by status', { component: 'ProjectService', status });
    const projects = await this.repository.findByStatus(status);
    logger.debug('Filtered projects by status', {
      component: 'ProjectService',
      status,
      count: projects.length,
    });
    return projects;
  }

  /**
   * Save project (full update)
   *
   * Performs a full project update by saving all project data.
   * Updates the updatedAt timestamp automatically.
   *
   * Side effects:
   * - Updates updatedAt timestamp
   * - Triggers semantic search synchronization (async, non-blocking)
   *
   * @param project - The complete project object to save
   * @throws {Error} When project is not found
   * @throws {RepositoryError} When database write fails
   * @example
   * const project = await projectService.getById('project-id');
   * if (project) {
   *   project.title = 'New Title';
   *   await projectService.save(project);
   * }
   */
  public async save(project: Project): Promise<void> {
    logger.debug('Saving full project', { component: 'ProjectService', projectId: project.id });

    const updated = await this.repository.update(project.id, {
      ...project,
      updatedAt: new Date(),
    });

    if (!updated) {
      const error = new Error(`Project not found: ${project.id}`);
      if (import.meta.env.NODE_ENV !== 'test') {
        logger.error('Failed to save project: not found', {
          component: 'ProjectService',
          projectId: project.id,
        });
      }
      throw error;
    }

    semanticSyncService.syncProject(project.id, updated).catch(error => {
      logger.warn('Failed to sync project embedding', { error });
    });
    logger.info('Project saved successfully', {
      component: 'ProjectService',
      projectId: project.id,
    });
  }
}

export { ProjectService };
export const projectService = new ProjectService();
