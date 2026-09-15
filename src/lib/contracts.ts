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

// Library Types
export type LibraryItemType = 'model' | 'environment' | 'design_reference' | 'style' | 'template';

export interface LibraryItemExtended {
  id: string;
  type: LibraryItemType;
  name: string;
  description?: string;
  imagePath?: string;
  thumbnailPath?: string;
  tags: string[];
  favorite: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Style System
export interface Style {
  id: string;
  name: string;
  description?: string;
  references: string[]; // image paths
  visualDescription: string;
  colors: string[];
  typographyHints?: string;
  layoutHints?: string;
  aiInstructions: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Model Reference (Person)
export interface ModelReference {
  id: string;
  name: string;
  description?: string;
  imagePath: string;
  thumbnailPath: string;
  tags: string[];
  metadata?: {
    gender?: string;
    age?: string;
    ethnicity?: string;
    bodyType?: string;
  };
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Environment Reference
export interface EnvironmentReference {
  id: string;
  name: string;
  category: 'studio' | 'room' | 'office' | 'kitchen' | 'bathroom' | 'street' | 'nature' | 'luxury' | 'other';
  description?: string;
  imagePath: string;
  thumbnailPath: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Design Reference
export type DesignReferenceMode = 'COPY' | 'INSPIRED';

export interface DesignReference {
  id: string;
  name: string;
  description?: string;
  imagePath: string;
  thumbnailPath: string;
  mode: DesignReferenceMode;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Try-On Request
export interface TryOnRequest {
  projectId: string;
  productAssetId: string;
  modelReferenceId: string;
  pose?: string;
  framing?: string;
  environmentId?: string;
  styleId?: string;
  model?: string;
}

// Lifestyle Request
export interface LifestyleRequest {
  projectId: string;
  productAssetId: string;
  environmentId: string;
  mood?: string;
  composition?: string;
  styleId?: string;
  references?: string[];
  model?: string;
}

// Advertising Request
export type AdObjective = 'sale' | 'launch' | 'brand_awareness' | 'feature_highlight' | 'premium' | 'social_ad' | 'marketplace';

export interface AdvertisingRequest {
  projectId: string;
  productAssetId: string;
  objective: AdObjective;
  format?: string;
  styleId?: string;
  copy?: string;
  references?: string[];
  model?: string;
}

// Product Card Types
export type CardType = 'main' | 'features' | 'benefits' | 'specifications' | 'usage' | 'comparison' | 'infographic';

export interface ProductCardRequest {
  projectId: string;
  productAssetId: string;
  cardType: CardType;
  styleId?: string;
  references?: string[];
  model?: string;
}

// Card Funnel
export interface CardFunnelPlan {
  projectId: string;
  productAssetId: string;
  cards: {
    type: CardType;
    enabled: boolean;
    styleId?: string;
  }[];
  styleId?: string;
}

// Replace Product
export type ReplaceMode = 'COPY' | 'ADAPT' | 'CONCEPT';

export interface ReplaceProductRequest {
  projectId: string;
  referenceDesignId: string;
  newProductAssetId: string;
  mode: ReplaceMode;
  styleId?: string;
  model?: string;
}

// Batch
export interface BatchJob {
  id: string;
  name: string;
  type: 'image_generation' | 'try_on' | 'lifestyle' | 'advertising' | 'product_card';
  items: BatchItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface BatchItem {
  id: string;
  batchId: string;
  input: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  resultId?: string;
  error?: string;
}

// Video
export interface VideoRequest {
  projectId: string;
  productAssetId?: string;
  startingImageId?: string;
  style?: string;
  scene?: string;
  duration: 5 | 10;
  aspectRatio?: string;
  prompt: string;
  model?: string;
}

// AI Scenario
export interface ScenarioScene {
  id: string;
  description: string;
  type: 'image' | 'video' | 'text';
  parameters: Record<string, any>;
}

export interface ScenarioPlan {
  id: string;
  projectId: string;
  name: string;
  description: string;
  scenes: ScenarioScene[];
  status: 'draft' | 'approved' | 'processing' | 'completed';
  createdAt: string;
}

// Editor
export interface EditorDocument {
  id: string;
  projectId: string;
  name: string;
  width: number;
  height: number;
  layers: EditorLayer[];
  createdAt: string;
  updatedAt: string;
}

export interface EditorLayer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  data: Record<string, any>;
}
