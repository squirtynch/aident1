// OpenRouter AI Provider Implementation

import type { AIModel, Capability, CapabilityStatus } from '../contracts';
import type { 
  AIProvider, 
  AIProviderResponse, 
  TextGenerationOptions, 
  VisionRequest, 
  ImageGenerationOptions,
  ImageEditOptions 
} from './provider';
import { AIError, AI_ERROR_CODES } from './provider';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
}

// Known capabilities for common models
const MODEL_CAPABILITIES: Record<string, Record<string, CapabilityStatus>> = {
  // Vision models
  'openai/gpt-4o': { TEXT: 'SUPPORTED', VISION: 'SUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'openai/gpt-4-vision-preview': { TEXT: 'SUPPORTED', VISION: 'SUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'anthropic/claude-3.5-sonnet': { TEXT: 'SUPPORTED', VISION: 'SUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'anthropic/claude-3-opus': { TEXT: 'SUPPORTED', VISION: 'SUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  
  // Image generation models
  'openai/dall-e-3': { TEXT: 'UNSUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'SUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'stabilityai/stable-diffusion-xl': { TEXT: 'UNSUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'SUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'midjourney/imagine': { TEXT: 'UNSUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'SUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  
  // Image editing models
  'openai/dall-e-2': { TEXT: 'UNSUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'SUPPORTED', IMAGE_EDITING: 'SUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  
  // Text models
  'openai/gpt-4': { TEXT: 'SUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'openai/gpt-3.5-turbo': { TEXT: 'SUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'anthropic/claude-3-haiku': { TEXT: 'SUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
  'google/gemini-pro': { TEXT: 'SUPPORTED', VISION: 'UNSUPPORTED', IMAGE_GENERATION: 'UNSUPPORTED', IMAGE_EDITING: 'UNSUPPORTED', VIDEO_GENERATION: 'UNSUPPORTED' },
};

export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';
  
  private apiKey: string = '';
  private baseUrl = 'https://openrouter.ai/api/v1';
  private modelsCache: AIModel[] | null = null;

  setApiKey(key: string): void {
    this.apiKey = key;
    this.modelsCache = null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new AIError(AI_ERROR_CODES.INVALID_API_KEY, 'API key not configured', false);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai-product-studio.local',
      'X-Title': 'AI Product Studio',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new AIError(AI_ERROR_CODES.INVALID_API_KEY, 'Invalid API key', false);
        }
        if (response.status === 429) {
          throw new AIError(AI_ERROR_CODES.RATE_LIMITED, 'Rate limit exceeded', true, error);
        }
        if (response.status === 404) {
          throw new AIError(AI_ERROR_CODES.MODEL_NOT_FOUND, 'Model not found', false);
        }
        if (response.status >= 500) {
          throw new AIError(AI_ERROR_CODES.SERVER_ERROR, `Server error: ${response.status}`, true);
        }
        
        throw new AIError(AI_ERROR_CODES.UNKNOWN, error.error?.message || 'Unknown error', false, error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AIError) throw error;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AIError(AI_ERROR_CODES.TIMEOUT, 'Request timeout', true);
        }
        throw new AIError(AI_ERROR_CODES.NETWORK_ERROR, error.message, true);
      }
      
      throw new AIError(AI_ERROR_CODES.UNKNOWN, 'Unknown error occurred', false);
    }
  }

  async validateApiKey(): Promise<AIProviderResponse<boolean>> {
    try {
      await this.request('/models');
      return { success: true, data: true };
    } catch (error) {
      if (error instanceof AIError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        };
      }
      return {
        success: false,
        error: {
          code: AI_ERROR_CODES.UNKNOWN,
          message: 'Failed to validate API key',
          retryable: false,
        },
      };
    }
  }

  async listModels(): Promise<AIProviderResponse<AIModel[]>> {
    try {
      if (this.modelsCache) {
        return { success: true, data: this.modelsCache };
      }

      const response = await this.request<{ data: OpenRouterModel[] }>('/models');
      
      const models: AIModel[] = response.data.map(m => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'openrouter',
        capabilities: this.inferCapabilities(m.id),
        contextWindow: m.context_length,
        costPerToken: m.pricing?.prompt ? parseFloat(m.pricing.prompt) : undefined,
        description: m.description,
      }));

      this.modelsCache = models;
      return { success: true, data: models };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getModel(id: string): Promise<AIProviderResponse<AIModel>> {
    try {
      const modelsResponse = await this.listModels();
      if (!modelsResponse.success || !modelsResponse.data) {
        return { success: false, error: modelsResponse.error };
      }

      const model = modelsResponse.data.find(m => m.id === id);
      if (!model) {
        return {
          success: false,
          error: {
            code: AI_ERROR_CODES.MODEL_NOT_FOUND,
            message: `Model ${id} not found`,
            retryable: false,
          },
        };
      }

      return { success: true, data: model };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCapability(modelId: string, capability: Capability): Promise<CapabilityStatus> {
    const caps = MODEL_CAPABILITIES[modelId];
    if (caps && caps[capability]) {
      return caps[capability];
    }
    return 'UNKNOWN';
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<AIProviderResponse<string>> {
    try {
      const model = options?.model || 'openai/gpt-4o-mini';
      
      const messages: any[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.request<{ choices: Array<{ message: { content: string } }>, usage?: any }>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000,
        }),
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new AIError(AI_ERROR_CODES.UNKNOWN, 'No content in response', false);
      }

      return {
        success: true,
        data: content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async analyzeImage(request: VisionRequest): Promise<AIProviderResponse<string>> {
    try {
      const model = request.model || 'openai/gpt-4o';
      
      const messages: any[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: request.prompt },
            { type: 'image_url', image_url: { url: request.image } },
          ],
        },
      ];

      const response = await this.request<{ choices: Array<{ message: { content: string } }>, usage?: any }>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
        }),
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new AIError(AI_ERROR_CODES.UNKNOWN, 'No content in response', false);
      }

      return {
        success: true,
        data: content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<AIProviderResponse<string[]>> {
    try {
      const model = options?.model || 'openai/dall-e-3';
      
      // Check if model supports image generation
      const capability = await this.getCapability(model, 'IMAGE_GENERATION');
      if (capability === 'UNSUPPORTED') {
        throw new AIError(AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED, `Model ${model} does not support image generation`, false);
      }

      // OpenRouter doesn't have a direct image generation endpoint yet
      // This is a placeholder for when it becomes available
      throw new AIError(AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED, 'Image generation not yet available through OpenRouter', false);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async editImage(image: string, options: ImageEditOptions): Promise<AIProviderResponse<string>> {
    try {
      const model = options.model || 'openai/dall-e-2';
      
      // Check if model supports image editing
      const capability = await this.getCapability(model, 'IMAGE_EDITING');
      if (capability === 'UNSUPPORTED') {
        throw new AIError(AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED, `Model ${model} does not support image editing`, false);
      }

      // OpenRouter doesn't have a direct image editing endpoint yet
      throw new AIError(AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED, 'Image editing not yet available through OpenRouter', false);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async generateStructuredOutput<T>(prompt: string, schema: object, options?: TextGenerationOptions): Promise<AIProviderResponse<T>> {
    try {
      const systemPrompt = `You must respond with valid JSON matching this schema: ${JSON.stringify(schema)}\nDo not include any text outside the JSON.`;
      
      const response = await this.generateText(prompt, {
        ...options,
        systemPrompt,
        temperature: 0.3,
      });

      if (!response.success || !response.data) {
        return { success: false, error: response.error };
      }

      try {
        const parsed = JSON.parse(response.data) as T;
        return { success: true, data: parsed, usage: response.usage };
      } catch (error) {
        throw new AIError(AI_ERROR_CODES.INVALID_REQUEST, 'Failed to parse structured output as JSON', false);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  private inferCapabilities(modelId: string): import('../contracts').ModelCapability[] {
    const caps = MODEL_CAPABILITIES[modelId];
    if (!caps) {
      // Default to text-only for unknown models
      return [
        { capability: 'TEXT', status: 'SUPPORTED' },
        { capability: 'VISION', status: 'UNKNOWN' },
        { capability: 'IMAGE_GENERATION', status: 'UNKNOWN' },
        { capability: 'IMAGE_EDITING', status: 'UNKNOWN' },
        { capability: 'VIDEO_GENERATION', status: 'UNKNOWN' },
      ];
    }

    return Object.entries(caps).map(([capability, status]) => ({
      capability: capability as Capability,
      status,
    }));
  }

  private handleError(error: unknown): AIProviderResponse<never> {
    if (error instanceof AIError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details,
        },
      };
    }
    return {
      success: false,
      error: {
        code: AI_ERROR_CODES.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: false,
      },
    };
  }
}
