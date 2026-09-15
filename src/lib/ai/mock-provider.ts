// Mock AI Provider for Testing and Development

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

export type MockScenario = 
  | 'success'
  | 'timeout'
  | 'rate_limit'
  | 'server_error'
  | 'invalid_response'
  | 'invalid_key'
  | 'unsupported_model'
  | 'slow'
  | 'cancelled';

export class MockAIProvider implements AIProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';
  
  private scenario: MockScenario = 'success';
  private delay: number = 100;
  private abortController: AbortController | null = null;

  setScenario(scenario: MockScenario, delay?: number): void {
    this.scenario = scenario;
    this.delay = delay ?? 100;
  }

  setApiKey(key: string): void {
    if (key === 'invalid') {
      this.scenario = 'invalid_key';
    }
  }

  private async simulateDelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.abortController = new AbortController();
      
      const timer = setTimeout(() => {
        resolve();
      }, this.delay);

      this.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new AIError(AI_ERROR_CODES.TIMEOUT, 'Request cancelled', false));
      });
    });
  }

  private async handleScenario<T>(successData: T): Promise<AIProviderResponse<T>> {
    try {
      await this.simulateDelay();

      switch (this.scenario) {
        case 'timeout':
          throw new AIError(AI_ERROR_CODES.TIMEOUT, 'Request timeout', true);
        case 'rate_limit':
          throw new AIError(AI_ERROR_CODES.RATE_LIMITED, 'Rate limit exceeded', true);
        case 'server_error':
          throw new AIError(AI_ERROR_CODES.SERVER_ERROR, 'Internal server error', true);
        case 'invalid_response':
          return { success: true, data: undefined as any };
        case 'invalid_key':
          throw new AIError(AI_ERROR_CODES.INVALID_API_KEY, 'Invalid API key', false);
        case 'unsupported_model':
          throw new AIError(AI_ERROR_CODES.MODEL_NOT_FOUND, 'Model not found', false);
        case 'cancelled':
          throw new AIError(AI_ERROR_CODES.TIMEOUT, 'Request cancelled', false);
        case 'slow':
          await new Promise(resolve => setTimeout(resolve, 5000));
          return { success: true, data: successData };
        case 'success':
        default:
          return { success: true, data: successData };
      }
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
          message: 'Unknown error',
          retryable: false,
        },
      };
    }
  }

  async validateApiKey(): Promise<AIProviderResponse<boolean>> {
    if (this.scenario === 'invalid_key') {
      return {
        success: false,
        error: {
          code: AI_ERROR_CODES.INVALID_API_KEY,
          message: 'Invalid API key',
          retryable: false,
        },
      };
    }
    return { success: true, data: true };
  }

  async listModels(): Promise<AIProviderResponse<AIModel[]>> {
    const models: AIModel[] = [
      {
        id: 'mock/gpt-4o',
        name: 'Mock GPT-4o',
        provider: 'mock',
        capabilities: [
          { capability: 'TEXT', status: 'SUPPORTED' },
          { capability: 'VISION', status: 'SUPPORTED' },
          { capability: 'IMAGE_GENERATION', status: 'UNSUPPORTED' },
          { capability: 'IMAGE_EDITING', status: 'UNSUPPORTED' },
          { capability: 'VIDEO_GENERATION', status: 'UNSUPPORTED' },
        ],
        contextWindow: 128000,
      },
      {
        id: 'mock/dall-e-3',
        name: 'Mock DALL-E 3',
        provider: 'mock',
        capabilities: [
          { capability: 'TEXT', status: 'UNSUPPORTED' },
          { capability: 'VISION', status: 'UNSUPPORTED' },
          { capability: 'IMAGE_GENERATION', status: 'SUPPORTED' },
          { capability: 'IMAGE_EDITING', status: 'UNSUPPORTED' },
          { capability: 'VIDEO_GENERATION', status: 'UNSUPPORTED' },
        ],
      },
      {
        id: 'mock/dall-e-2',
        name: 'Mock DALL-E 2',
        provider: 'mock',
        capabilities: [
          { capability: 'TEXT', status: 'UNSUPPORTED' },
          { capability: 'VISION', status: 'UNSUPPORTED' },
          { capability: 'IMAGE_GENERATION', status: 'SUPPORTED' },
          { capability: 'IMAGE_EDITING', status: 'SUPPORTED' },
          { capability: 'VIDEO_GENERATION', status: 'UNSUPPORTED' },
        ],
      },
    ];

    return this.handleScenario(models);
  }

  async getModel(id: string): Promise<AIProviderResponse<AIModel>> {
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
  }

  async getCapability(modelId: string, capability: Capability): Promise<CapabilityStatus> {
    const modelResponse = await this.getModel(modelId);
    if (!modelResponse.success || !modelResponse.data) {
      return 'UNKNOWN';
    }

    const cap = modelResponse.data.capabilities.find(c => c.capability === capability);
    return cap?.status || 'UNKNOWN';
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<AIProviderResponse<string>> {
    const mockText = `This is a mock response for: "${prompt.substring(0, 50)}..."`;
    return this.handleScenario(mockText);
  }

  async analyzeImage(request: VisionRequest): Promise<AIProviderResponse<string>> {
    const mockAnalysis = JSON.stringify({
      category: 'Electronics',
      productName: 'Mock Product',
      colors: ['black', 'silver'],
      materials: ['plastic', 'metal'],
      features: ['wireless', 'rechargeable'],
      visualCharacteristics: ['sleek design', 'modern'],
      detectedText: ['Brand Name'],
      constraints: ['fragile'],
      confidence: 0.95,
    });
    return this.handleScenario(mockAnalysis);
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<AIProviderResponse<string[]>> {
    // Return a placeholder image URL
    const mockImages = [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzM0OGRiZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TW9jayBJbWFnZTwvdGV4dD48L3N2Zz4=',
    ];
    return this.handleScenario(mockImages);
  }

  async editImage(image: string, options: ImageEditOptions): Promise<AIProviderResponse<string>> {
    const mockEditedImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TW9jayBFZGl0ZWQ8L3RleHQ+PC9zdmc+';
    return this.handleScenario(mockEditedImage);
  }

  async generateStructuredOutput<T>(prompt: string, schema: object, options?: TextGenerationOptions): Promise<AIProviderResponse<T>> {
    const mockData = {
      category: 'Electronics',
      productName: 'Mock Product',
      colors: ['black', 'silver'],
      materials: ['plastic', 'metal'],
      features: ['wireless', 'rechargeable'],
      visualCharacteristics: ['sleek design', 'modern'],
      detectedText: ['Brand Name'],
      constraints: ['fragile'],
      confidence: 0.95,
    } as T;
    return this.handleScenario(mockData);
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
