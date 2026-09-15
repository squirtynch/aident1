import type { Project, Asset, AppSettings, StoragePaths } from './contracts';

const STORAGE_KEYS = {
  PROJECTS: 'ai-studio-projects',
  ASSETS: 'ai-studio-assets',
  SETTINGS: 'ai-studio-settings',
};

// Default storage paths (in production, these come from Tauri/Python)
const DEFAULT_STORAGE_PATHS: StoragePaths = {
  root: 'Documents/AI Product Studio',
  database: 'Documents/AI Product Studio/database',
  projects: 'Documents/AI Product Studio/projects',
  library: 'Documents/AI Product Studio/library',
  cache: 'Documents/AI Product Studio/cache',
  exports: 'Documents/AI Product Studio/exports',
  logs: 'Documents/AI Product Studio/logs',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  storagePath: DEFAULT_STORAGE_PATHS.root,
  language: 'en',
  autoSave: true,
  notifications: true,
};

// Projects
export function getProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function getProject(id: string): Project | undefined {
  return getProjects().find(p => p.id === id);
}

export function createProject(project: Project) {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
}

export function updateProject(id: string, updates: Partial<Project>) {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
    saveProjects(projects);
  }
}

export function deleteProject(id: string) {
  const projects = getProjects().filter(p => p.id !== id);
  saveProjects(projects);
}

// Assets
export function getAssets(projectId?: string): Asset[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
  const assets: Asset[] = data ? JSON.parse(data) : [];
  if (projectId) {
    return assets.filter(a => a.projectId === projectId);
  }
  return assets;
}

export function saveAssets(assets: Asset[]) {
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
}

export function addAsset(asset: Asset) {
  const assets = getAssets();
  assets.push(asset);
  saveAssets(assets);
}

export function removeAsset(id: string) {
  const assets = getAssets().filter(a => a.id !== id);
  saveAssets(assets);
}

// Settings
export function getSettings(): AppSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<AppSettings>) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
}

// Storage paths
export function getStoragePaths(): StoragePaths {
  return DEFAULT_STORAGE_PATHS;
}

// Generations
const GENERATIONS_KEY = 'ai-studio-generations';
const GENERATION_VERSIONS_KEY = 'ai-studio-generation-versions';
const AI_TEXT_RESULTS_KEY = 'ai-studio-ai-text-results';

export function getGenerations(projectId?: string): import('./contracts').Generation[] {
  const data = localStorage.getItem(GENERATIONS_KEY);
  const generations: import('./contracts').Generation[] = data ? JSON.parse(data) : [];
  if (projectId) {
    return generations.filter(g => g.projectId === projectId);
  }
  return generations;
}

export function saveGenerations(generations: import('./contracts').Generation[]) {
  localStorage.setItem(GENERATIONS_KEY, JSON.stringify(generations));
}

export function addGeneration(generation: import('./contracts').Generation) {
  const generations = getGenerations();
  generations.unshift(generation);
  saveGenerations(generations);
}

export function updateGeneration(id: string, updates: Partial<import('./contracts').Generation>) {
  const generations = getGenerations();
  const index = generations.findIndex(g => g.id === id);
  if (index !== -1) {
    generations[index] = { ...generations[index], ...updates, updatedAt: new Date().toISOString() };
    saveGenerations(generations);
  }
}

export function deleteGeneration(id: string) {
  const generations = getGenerations().filter(g => g.id !== id);
  saveGenerations(generations);
}

// Generation Versions
export function getGenerationVersions(generationId?: string): import('./contracts').GenerationVersion[] {
  const data = localStorage.getItem(GENERATION_VERSIONS_KEY);
  const versions: import('./contracts').GenerationVersion[] = data ? JSON.parse(data) : [];
  if (generationId) {
    return versions.filter(v => v.generationId === generationId);
  }
  return versions;
}

export function saveGenerationVersions(versions: import('./contracts').GenerationVersion[]) {
  localStorage.setItem(GENERATION_VERSIONS_KEY, JSON.stringify(versions));
}

export function addGenerationVersion(version: import('./contracts').GenerationVersion) {
  const versions = getGenerationVersions();
  versions.push(version);
  saveGenerationVersions(versions);
}

// AI Text Results
export function getAITextResults(projectId?: string): import('./contracts').AITextResult[] {
  const data = localStorage.getItem(AI_TEXT_RESULTS_KEY);
  const results: import('./contracts').AITextResult[] = data ? JSON.parse(data) : [];
  return results;
}

export function saveAITextResult(result: import('./contracts').AITextResult) {
  const results = getAITextResults();
  results.unshift(result);
  localStorage.setItem(AI_TEXT_RESULTS_KEY, JSON.stringify(results));
}

// AI Settings
const AI_SETTINGS_KEY = 'ai-studio-ai-settings';

export function getAISettings(): import('./contracts').ProviderConfig {
  const data = localStorage.getItem(AI_SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    provider: 'openrouter',
    defaultModel: 'openai/gpt-4o-mini',
    textModel: 'openai/gpt-4o-mini',
    visionModel: 'openai/gpt-4o',
    imageModel: 'openai/dall-e-3',
    imageEditModel: 'openai/dall-e-2',
  };
}

export function saveAISettings(settings: import('./contracts').ProviderConfig) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}
