/**
 * Project Service
 *
 * Handles project persistence using the database abstraction layer
 */

import { PublishStatus } from '../../../types';
import { type Project, type Language } from '../../../types';
import { type ProjectCreationData, type ProjectUpdateData } from '../types';
import { db } from '../../../lib/db';

class ProjectService {
  /**
   * Initialize database
   */
  public async init(): Promise<void> {
    await db.init();
  }

  /**
   * Get all projects
   */
  public async getAll(): Promise<Project[]> {
    await this.init();
    const summaries = await db.getAllProjects();

    // Load full project data for each summary
    const projects: Project[] = [];
    for (const summary of summaries) {
      const project = await db.loadProject(summary.id);
      if (project) {
        projects.push(project);
      }
    }

    return projects;
  }

  /**
   * Get project by ID
   */
  public async getById(id: string): Promise<Project | null> {
    await this.init();
    return await db.loadProject(id);
  }

  /**
   * Create new project
   */
  public async create(data: ProjectCreationData): Promise<Project> {
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
    return project;
  }

  /**
   * Update project
   */
  public async update(id: string, data: ProjectUpdateData): Promise<void> {
    await this.init();

    const project = await this.getById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    const updated: Project = {
      ...project,
      ...data,
      updatedAt: new Date(),
    };

    await db.saveProject(updated);
  }

  /**
   * Delete project
   */
  public async delete(id: string): Promise<void> {
    await this.init();
    await db.deleteProject(id);
  }

  /**
   * Get projects by status
   */
  public async getByStatus(status: PublishStatus): Promise<Project[]> {
    const allProjects = await this.getAll();
    return allProjects.filter(project => (project.status as PublishStatus) === status);
  }

  /**
   * Save project (full update)
   */
  public async save(project: Project): Promise<void> {
    await this.init();

    const updated = {
      ...project,
      updatedAt: new Date(),
    };

    await db.saveProject(updated);
  }
}

export const projectService = new ProjectService();
