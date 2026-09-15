// Project Import/Export System

import { getProject, getAssets, getGenerations, getGenerationVersions, getAITextResults } from './storage';
import { libraryService } from './library';
import { styleService } from './style-service';
import { modelReferenceService, environmentReferenceService, designReferenceService } from './references';
import { editorService } from './creative-services';
import { logger } from './logger';
import type { Project, Asset, Generation, GenerationVersion, AITextResult } from './contracts';

export interface ProjectManifest {
  version: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  exportedAt: string;
  assets: Asset[];
  generations: Generation[];
  generationVersions: GenerationVersion[];
  aiTextResults: AITextResult[];
  styles: any[];
  references: {
    models: any[];
    environments: any[];
    designs: any[];
  };
  editorDocuments: any[];
}

class ProjectExportService {
  async exportProject(projectId: string): Promise<Blob> {
    const project = getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    logger.projectExported(projectId, project.name);

    // Gather all project data
    const assets = getAssets(projectId);
    const generations = getGenerations(projectId);
    const generationVersions = getGenerationVersions();
    const aiTextResults = getAITextResults();
    const styles = styleService.getAll();
    const models = modelReferenceService.getAll();
    const environments = environmentReferenceService.getAll();
    const designs = designReferenceService.getAll();
    const editorDocuments = editorService.getAll(projectId);

    // Create manifest
    const manifest: ProjectManifest = {
      version: '1.0.0',
      projectId: project.id,
      projectName: project.name,
      createdAt: project.createdAt,
      exportedAt: new Date().toISOString(),
      assets,
      generations,
      generationVersions,
      aiTextResults,
      styles,
      references: {
        models,
        environments,
        designs,
      },
      editorDocuments,
    };

    // Create ZIP file (using JSZip-like structure)
    // For simplicity, we'll create a JSON export
    // In production with Tauri, this would use native ZIP libraries
    const exportData = {
      manifest,
      project,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    return blob;
  }

  async downloadProject(projectId: string): Promise<void> {
    const project = getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const blob = await this.exportProject(projectId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('project.exported', `Project exported: ${project.name}`, { projectId });
  }
}

class ProjectImportService {
  async importProject(file: File): Promise<Project> {
    // Validate file
    if (!file.name.endsWith('.json')) {
      throw new Error('Invalid file format. Please select a JSON export file.');
    }

    // Read file
    const text = await file.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid JSON format. File may be corrupted.');
    }

    // Validate structure
    if (!data.manifest || !data.project) {
      throw new Error('Invalid project file. Missing manifest or project data.');
    }

    const manifest = data.manifest as ProjectManifest;
    const project = data.project as Project;

    // Validate manifest version
    if (!manifest.version) {
      throw new Error('Invalid manifest version.');
    }

    // Security check: prevent path traversal
    if (project.name.includes('..') || project.name.includes('/') || project.name.includes('\\')) {
      throw new Error('Invalid project name. Contains forbidden characters.');
    }

    logger.projectImported(project.id, project.name);

    // Import project
    const { createProject } = await import('./storage');
    createProject({
      ...project,
      updatedAt: new Date().toISOString(),
    });

    // Import assets
    if (manifest.assets && manifest.assets.length > 0) {
      const { saveAssets } = await import('./storage');
      saveAssets(manifest.assets);
    }

    // Import generations
    if (manifest.generations && manifest.generations.length > 0) {
      const { saveGenerations } = await import('./storage');
      saveGenerations(manifest.generations);
    }

    // Import generation versions
    if (manifest.generationVersions && manifest.generationVersions.length > 0) {
      const { saveGenerationVersions } = await import('./storage');
      saveGenerationVersions(manifest.generationVersions);
    }

    // Import AI text results
    if (manifest.aiTextResults && manifest.aiTextResults.length > 0) {
      const { saveAITextResult } = await import('./storage');
      manifest.aiTextResults.forEach((result: AITextResult) => {
        saveAITextResult(result);
      });
    }

    // Import styles
    if (manifest.styles && manifest.styles.length > 0) {
      manifest.styles.forEach((style: any) => {
        styleService.create(style);
      });
    }

    // Import references
    if (manifest.references) {
      if (manifest.references.models) {
        manifest.references.models.forEach((model: any) => {
          modelReferenceService.create(model);
        });
      }
      if (manifest.references.environments) {
        manifest.references.environments.forEach((env: any) => {
          environmentReferenceService.create(env);
        });
      }
      if (manifest.references.designs) {
        manifest.references.designs.forEach((design: any) => {
          designReferenceService.create(design);
        });
      }
    }

    // Import editor documents
    if (manifest.editorDocuments && manifest.editorDocuments.length > 0) {
      manifest.editorDocuments.forEach((doc: any) => {
        editorService.create(doc.projectId, doc.name, doc.width, doc.height);
      });
    }

    logger.info('project.imported', `Project imported successfully: ${project.name}`, { projectId: project.id });

    return project;
  }

  async importProjectFromFile(): Promise<Project> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const project = await this.importProject(file);
          resolve(project);
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  }
}

export const projectExportService = new ProjectExportService();
export const projectImportService = new ProjectImportService();
