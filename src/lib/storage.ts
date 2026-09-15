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
