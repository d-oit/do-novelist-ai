/**
 * Project Service
 *
 * Handles project persistence using the database abstraction layer
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logging/logger';
import { PublishStatus } from '@/types';
import {
  type Project,
  type Language,
  type ProjectCreationData,
  type ProjectUpdateData,
} from '@/types';

class ProjectService {
  /**
   * Initialize database
   */
  public async init(): Promise<void> {
    logger.debug('Initializing database connection', { component: 'ProjectService' });
    await db.init();
    logger.debug('Database initialized', { component: 'ProjectService' });
  }

  /**
   * Get all projects
   */
  public async getAll(): Promise<Project[]> {
    logger.debug('Fetching all projects', { component: 'ProjectService' });
    await this.init();
    const summaries = await db.getAllProjects();

    // Load full project data for each summary
    const projects: Project[] = [];
    for (const summary of summaries) {
      try {
        const project = await db.loadProject(summary.id);
        if (project) {
          projects.push(project);
        }
      } catch (error) {
        logger.error('Failed to load project details', {
          component: 'ProjectService',
          projectId: summary.id,
          error,
        });
      }
    }

    logger.info('Retrieved all projects', { component: 'ProjectService', count: projects.length });
    return projects;
  }

  /**
   * Get project by ID
   */
  public async getById(id: string): Promise<Project | null> {
    logger.debug('Fetching project by ID', { component: 'ProjectService', projectId: id });
    await this.init();
    const project = await db.loadProject(id);

    if (!project) {
      logger.warn('Project not found', { component: 'ProjectService', projectId: id });
    }

    return project;
  }

  /**
   * Create new project
   */
  public async create(data: ProjectCreationData): Promise<Project> {
    logger.info('Creating new project', { component: 'ProjectService', title: data.title });
    await this.init();

    const now = Date.now();
    const projectId = crypto.randomUUID();
    const project: Project = {
      id: projectId,
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

    await db.saveProject(project);
    logger.info('Project created successfully', { component: 'ProjectService', projectId });
    return project;
  }

  /**
   * Update project
   */
  public async update(id: string, data: ProjectUpdateData): Promise<void> {
    logger.debug('Updating project', { component: 'ProjectService', projectId: id });
    await this.init();

    const project = await this.getById(id);
    if (!project) {
      const error = new Error(`Project not found: ${id}`);
      logger.error('Failed to update project: not found', {
        component: 'ProjectService',
        projectId: id,
      });
      throw error;
    }

    const updated: Project = {
      ...project,
      ...data,
      updatedAt: new Date(),
    };

    await db.saveProject(updated);
    logger.info('Project updated successfully', { component: 'ProjectService', projectId: id });
  }

  /**
   * Delete project
   */
  public async delete(id: string): Promise<void> {
    logger.warn('Deleting project', { component: 'ProjectService', projectId: id });
    await this.init();
    await db.deleteProject(id);
    logger.info('Project deleted', { component: 'ProjectService', projectId: id });
  }

  /**
   * Get projects by status
   */
  public async getByStatus(status: PublishStatus): Promise<Project[]> {
    logger.debug('Fetching projects by status', { component: 'ProjectService', status });
    const allProjects = await this.getAll();
    const filtered = allProjects.filter(project => (project.status as PublishStatus) === status);
    logger.debug('Filtered projects by status', {
      component: 'ProjectService',
      status,
      count: filtered.length,
    });
    return filtered;
  }

  /**
   * Save project (full update)
   */
  public async save(project: Project): Promise<void> {
    logger.debug('Saving full project', { component: 'ProjectService', projectId: project.id });
    await this.init();

    const updated = {
      ...project,
      updatedAt: new Date(),
    };

    await db.saveProject(updated);
    logger.info('Project saved successfully', {
      component: 'ProjectService',
      projectId: project.id,
    });
  }
}

export const projectService = new ProjectService();
