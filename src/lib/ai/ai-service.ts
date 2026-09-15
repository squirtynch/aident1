// AI Service - Main service for AI operations

import type { 
  ProductAnalysis, 
  AITextRequest, 
  AITextResult,
  ImageGenerationRequest,
  ImageEditRequest,
  ProductPhotoRequest,
  Generation,
  GenerationVersion
} from '../contracts';
import { providerRegistry } from './provider-registry';
import { capabilityService } from './capability-service';
import { promptEngine, type PromptContext } from './prompt-engine';
import { credentialStore } from './credential-store';
import { AIError, AI_ERROR_CODES } from './provider';
import { v4 as uuidv4 } from 'uuid';

class AIService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load API key from credential store
    const apiKey = await credentialStore.getCredential('openrouter', 'api_key');
    if (apiKey) {
      const provider = providerRegistry.get('openrouter');
      if (provider) {
        provider.setApiKey(apiKey);
      }
    }

    this.initialized = true;
  }

  async setApiKey(providerId: string, apiKey: string): Promise<void> {
    await credentialStore.setCredential(providerId, 'api_key', apiKey);
    
    const provider = providerRegistry.get(providerId);
    if (provider) {
      provider.setApiKey(apiKey);
    }

    this.initialized = true;
  }

  async validateApiKey(providerId: string = 'openrouter'): Promise<{ valid: boolean; error?: string }> {
    const provider = providerRegistry.get(providerId);
    if (!provider) {
      return { valid: false, error: 'Provider not found' };
    }

    const response = await provider.validateApiKey();
    if (response.success) {
      return { valid: true };
    }

    return { valid: false, error: response.error?.message };
  }

  async analyzeProduct(imageData: string, model?: string): Promise<ProductAnalysis> {
    await this.initialize();

    const provider = providerRegistry.getActive();
    const visionModel = model || 'openai/gpt-4o';

    // Check capability
    const isSupported = await capabilityService.isSupported(visionModel, 'VISION');
    if (!isSupported) {
      throw new AIError(
        AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED,
        `Model ${visionModel} does not support vision/image analysis`,
        false
      );
    }

    const prompt = promptEngine.buildProductAnalysisPrompt();
    
    const response = await provider.analyzeImage({
      image: imageData,
      prompt,
      model: visionModel,
    });

    if (!response.success || !response.data) {
      throw new AIError(
        response.error?.code || AI_ERROR_CODES.UNKNOWN,
        response.error?.message || 'Failed to analyze product',
        response.error?.retryable || false
      );
    }

    // Parse and validate response
    try {
      const analysis = JSON.parse(response.data) as ProductAnalysis;
      
      // Validate required fields
      if (!analysis.category || !analysis.productName || analysis.confidence === undefined) {
        throw new Error('Invalid analysis response structure');
      }

      return analysis;
    } catch (error) {
      throw new AIError(
        AI_ERROR_CODES.INVALID_REQUEST,
        'Failed to parse product analysis response',
        false
      );
    }
  }

  async generateAIText(request: AITextRequest): Promise<AITextResult> {
    await this.initialize();

    const provider = providerRegistry.getActive();
    const model = request.model || 'openai/gpt-4o-mini';

    // Check capability
    const isSupported = await capabilityService.isSupported(model, 'TEXT');
    if (!isSupported) {
      throw new AIError(
        AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED,
        `Model ${model} does not support text generation`,
        false
      );
    }

    const context: PromptContext = {
      product: request.product,
      userRequest: request.customInstructions,
    };

    const prompt = promptEngine.buildAITextPrompt(request.type, context);

    const response = await provider.generateText(prompt, {
      model,
      temperature: 0.7,
    });

    if (!response.success || !response.data) {
      throw new AIError(
        response.error?.code || AI_ERROR_CODES.UNKNOWN,
        response.error?.message || 'Failed to generate text',
        response.error?.retryable || false
      );
    }

    return {
      text: response.data,
      model,
      tokensUsed: response.usage?.totalTokens,
      createdAt: new Date().toISOString(),
    };
  }

  async generateProductPhoto(request: ProductPhotoRequest): Promise<string[]> {
    await this.initialize();

    const provider = providerRegistry.getActive();
    const model = request.model || 'openai/dall-e-3';

    // Check capability
    const isSupported = await capabilityService.isSupported(model, 'IMAGE_GENERATION');
    if (!isSupported) {
      throw new AIError(
        AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED,
        `Model ${model} does not support image generation`,
        false
      );
    }

    // Build prompt
    const context: PromptContext = {
      style: request.style,
      environment: request.background,
      outputRequirements: {
        aspectRatio: request.aspectRatio,
        resolution: request.resolution,
      },
    };

    const prompt = promptEngine.render('product_photo', {
      ...context,
      product_name: 'Product',
      category: 'General',
      colors: [],
      materials: [],
      features: [],
      composition: request.composition || 'centered',
      background: request.background || 'clean white',
      output_requirements: request.aspectRatio ? `Aspect ratio: ${request.aspectRatio}` : '',
    });

    const fullPrompt = `${request.goal}\n\n${prompt}`;

    const response = await provider.generateImage(fullPrompt, {
      model,
      aspectRatio: request.aspectRatio,
      resolution: request.resolution,
      variations: request.variations || 1,
    });

    if (!response.success || !response.data) {
      throw new AIError(
        response.error?.code || AI_ERROR_CODES.UNKNOWN,
        response.error?.message || 'Failed to generate image',
        response.error?.retryable || false
      );
    }

    return response.data;
  }

  async improveImage(request: ImageEditRequest): Promise<string> {
    await this.initialize();

    const provider = providerRegistry.getActive();
    const model = request.model || 'openai/dall-e-2';

    // Check capability
    const isSupported = await capabilityService.isSupported(model, 'IMAGE_EDITING');
    if (!isSupported) {
      throw new AIError(
        AI_ERROR_CODES.CAPABILITY_NOT_SUPPORTED,
        `Model ${model} does not support image editing. Please select a different model.`,
        false
      );
    }

    const response = await provider.editImage(request.sourceAssetId, {
      model,
      instruction: request.instruction,
    });

    if (!response.success || !response.data) {
      throw new AIError(
        response.error?.code || AI_ERROR_CODES.UNKNOWN,
        response.error?.message || 'Failed to edit image',
        response.error?.retryable || false
      );
    }

    return response.data;
  }

  async listModels() {
    await this.initialize();
    const provider = providerRegistry.getActive();
    return provider.listModels();
  }

  async getModelsForCapability(capability: 'TEXT' | 'VISION' | 'IMAGE_GENERATION' | 'IMAGE_EDITING' | 'VIDEO_GENERATION') {
    const modelsResponse = await this.listModels();
    if (!modelsResponse.success || !modelsResponse.data) {
      return [];
    }

    const compatible: typeof modelsResponse.data = [];
    for (const model of modelsResponse.data) {
      const isSupported = await capabilityService.isSupported(model.id, capability);
      if (isSupported) {
        compatible.push(model);
      }
    }

    return compatible;
  }
}

export const aiService = new AIService();
