// AI Provider Abstraction Layer
// All AI operations go through this interface

import type { 
  AIModel, 
  Capability, 
  CapabilityStatus,
  ProductAnalysis,
  AITextRequest,
  AITextResult
} from '../contracts';

export interface TextGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface VisionRequest {
  image: string; // base64 or URL
  prompt: string;
  model?: string;
}

export interface ImageGenerationOptions {
  model?: string;
  aspectRatio?: string;
  resolution?: string;
  variations?: number;
}

export interface ImageEditOptions {
  model?: string;
  instruction: string;
}

export interface AIProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;

  // Authentication
  setApiKey(key: string): void;
  validateApiKey(): Promise<AIProviderResponse<boolean>>;

  // Models
  listModels(): Promise<AIProviderResponse<AIModel[]>>;
  getModel(id: string): Promise<AIProviderResponse<AIModel>>;

  // Capabilities
  getCapability(modelId: string, capability: Capability): Promise<CapabilityStatus>;

  // Text generation
  generateText(prompt: string, options?: TextGenerationOptions): Promise<AIProviderResponse<string>>;

  // Vision / Image analysis
  analyzeImage(request: VisionRequest): Promise<AIProviderResponse<string>>;

  // Image generation
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<AIProviderResponse<string[]>>;

  // Image editing
  editImage(image: string, options: ImageEditOptions): Promise<AIProviderResponse<string>>;

  // Structured output (for product analysis)
  generateStructuredOutput<T>(prompt: string, schema: object, options?: TextGenerationOptions): Promise<AIProviderResponse<T>>;
}

// Error codes
export const AI_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  CAPABILITY_NOT_SUPPORTED: 'CAPABILITY_NOT_SUPPORTED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  CONTENT_POLICY: 'CONTENT_POLICY',
  UNKNOWN: 'UNKNOWN',
} as const;

export class AIError extends Error {
  code: string;
  retryable: boolean;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, retryable = false, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
}
