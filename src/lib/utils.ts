import { v4 as uuidv4 } from 'uuid';
import type { Project, Asset } from './contracts';
import * as storage from './storage';

// SHA-256 hash computation
export async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate thumbnail from image file
export async function generateThumbnail(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Supported: PNG, JPG, JPEG, WebP` };
  }
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 50MB.' };
  }
  return { valid: true };
}

// Project operations
export function createNewProject(name: string, description = ''): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    archived: false,
    thumbnail: null,
  };
  storage.createProject(project);
  return project;
}

export function renameProject(id: string, name: string) {
  storage.updateProject(id, { name });
}

export function duplicateProject(id: string): Project | null {
  const original = storage.getProject(id);
  if (!original) return null;
  const now = new Date().toISOString();
  const duplicate: Project = {
    ...original,
    id: uuidv4(),
    name: `${original.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    favorite: false,
  };
  storage.createProject(duplicate);
  return duplicate;
}

export function toggleFavorite(id: string) {
  const project = storage.getProject(id);
  if (project) {
    storage.updateProject(id, { favorite: !project.favorite });
  }
}

export function archiveProject(id: string) {
  storage.updateProject(id, { archived: true });
}

export function unarchiveProject(id: string) {
  storage.updateProject(id, { archived: false });
}

// Asset import pipeline
export async function importAsset(file: File, projectId: string): Promise<Asset> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const hash = await computeSHA256(file);

  // Check for duplicate
  const existing = storage.getAssets(projectId).find(a => a.hash === hash);
  if (existing) {
    return existing;
  }

  const thumbnail = await generateThumbnail(file);
  const dataUrl = await fileToDataUrl(file);

  const asset: Asset = {
    id: uuidv4(),
    projectId,
    name: file.name,
    originalPath: dataUrl,
    thumbnailPath: thumbnail,
    hash,
    mimeType: file.type,
    sizeBytes: file.size,
    width: null,
    height: null,
    createdAt: new Date().toISOString(),
  };

  storage.addAsset(asset);
  return asset;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}
