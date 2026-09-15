// Shared contracts for AI Product Studio
// These types define the data structures used across the application

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  archived: boolean;
  thumbnail: string | null;
}

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  originalPath: string;
  thumbnailPath: string;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface Generation {
  id: string;
  projectId: string;
  type: 'product_card' | 'infographic' | 'lifestyle' | 'advertising' | 'try_on' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface GenerationVersion {
  id: string;
  generationId: string;
  version: number;
  imagePath: string;
  thumbnailPath: string;
  prompt: string;
  parameters: Record<string, unknown>;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  type: 'image' | 'template' | 'preset';
  path: string;
  thumbnailPath: string;
  tags: string[];
  createdAt: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface StoragePaths {
  root: string;
  database: string;
  projects: string;
  library: string;
  cache: string;
  exports: string;
  logs: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  storagePath: string;
  language: string;
  autoSave: boolean;
  notifications: boolean;
}

export type PageId = 'dashboard' | 'create' | 'projects' | 'library' | 'batch' | 'history' | 'settings';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}
