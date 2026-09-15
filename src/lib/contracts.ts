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
  type: 'product_photo' | 'product_card' | 'infographic' | 'lifestyle' | 'advertising' | 'try_on' | 'video' | 'improve' | 'ai_text';
  status: 'created' | 'queued' | 'preparing' | 'processing' | 'downloading' | 'finalizing' | 'completed' | 'failed' | 'retrying' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  prompt?: string;
  model?: string;
  error?: string;
  retryCount?: number;
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

// AI Engine Types
export type Capability = 'TEXT' | 'VISION' | 'IMAGE_GENERATION' | 'IMAGE_EDITING' | 'VIDEO_GENERATION';
export type CapabilityStatus = 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';

export interface ModelCapability {
  capability: Capability;
  status: CapabilityStatus;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  contextWindow?: number;
  maxTokens?: number;
  costPerToken?: number;
  description?: string;
}

export interface ProductAnalysis {
  category: string;
  productName: string;
  colors: string[];
  materials: string[];
  features: string[];
  visualCharacteristics: string[];
  detectedText: string[];
  constraints: string[];
  confidence: number;
}

export type AITextType = 
  | 'PRODUCT_NAME'
  | 'SHORT_DESCRIPTION'
  | 'LONG_DESCRIPTION'
  | 'BULLETS'
  | 'FEATURES'
  | 'BENEFITS'
  | 'SEO'
  | 'AD_COPY'
  | 'SOCIAL'
  | 'MARKETPLACE'
  | 'CUSTOM';

export interface AITextRequest {
  type: AITextType;
  product?: ProductAnalysis;
  context?: string;
  customInstructions?: string;
  model?: string;
}

export interface AITextResult {
  text: string;
  model: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface ImageGenerationRequest {
  projectId: string;
  sourceAssetId?: string;
  prompt: string;
  references?: string[];
  model?: string;
  aspectRatio?: string;
  resolution?: string;
  variations?: number;
}

export interface ImageEditRequest {
  projectId: string;
  sourceAssetId: string;
  instruction: string;
  model?: string;
}

export interface ProductPhotoRequest {
  projectId: string;
  productAssetId: string;
  goal: string;
  style?: string;
  composition?: string;
  background?: string;
  aspectRatio?: string;
  resolution?: string;
  variations?: number;
  references?: string[];
  model?: string;
}

export type QueueJobStatus = 
  | 'CREATED'
  | 'QUEUED'
  | 'PREPARING'
  | 'PROCESSING'
  | 'DOWNLOADING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export interface QueueJob {
  id: string;
  type: 'image_generation' | 'image_edit' | 'ai_text' | 'product_analysis';
  status: QueueJobStatus;
  request: ImageGenerationRequest | ImageEditRequest | AITextRequest | any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  textModel?: string;
  visionModel?: string;
  imageModel?: string;
  imageEditModel?: string;
  videoModel?: string;
}
