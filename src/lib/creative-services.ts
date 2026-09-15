// Creative Services - Try-On, Lifestyle, Advertising, Product Cards, Video, Scenario, Batch, Editor

import type {
  TryOnRequest,
  LifestyleRequest,
  AdvertisingRequest,
  ProductCardRequest,
  CardFunnelPlan,
  ReplaceProductRequest,
  VideoRequest,
  ScenarioPlan,
  ScenarioScene,
  BatchJob,
  BatchItem,
  EditorDocument,
  EditorLayer,
  Generation,
} from './contracts';
import { aiService } from './ai/ai-service';
import { generationQueue } from './ai/queue';
import { styleService } from './style-service';
import { environmentReferenceService } from './references';
import { promptEngine } from './ai/prompt-engine';
import { addGeneration, addGenerationVersion, getGenerationVersions } from './storage';
import { v4 as uuidv4 } from 'uuid';

// Try-On Service
class TryOnService {
  async generate(request: TryOnRequest): Promise<string[]> {
    const { productAssetId, modelReferenceId, pose, framing, environmentId, styleId, model } = request;
    
    // Build prompt
    let prompt = 'Professional try-on photo showing the product being worn/used';
    
    if (pose) prompt += `, ${pose} pose`;
    if (framing) prompt += `, ${framing} framing`;
    
    if (environmentId) {
      const env = environmentReferenceService.getById(environmentId);
      if (env) {
        prompt += `, in ${env.name} environment`;
      }
    }
    
    if (styleId) {
      const style = styleService.getById(styleId);
      if (style) {
        prompt += `, ${style.visualDescription}`;
      }
    }

    // Generate using existing AI service
    const images = await aiService.generateProductPhoto({
      projectId: request.projectId,
      productAssetId,
      goal: prompt,
      model,
    });

    // Save generation
    const generation: Generation = {
      id: uuidv4(),
      projectId: request.projectId,
      type: 'try_on',
      status: 'completed',
      prompt,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGeneration(generation);

    // Save version
    if (images.length > 0) {
      const version = {
        id: uuidv4(),
        generationId: generation.id,
        version: 1,
        imagePath: images[0],
        thumbnailPath: images[0],
        prompt,
        parameters: request as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };
      addGenerationVersion(version);
    }

    return images;
  }
}

// Lifestyle Service
class LifestyleService {
  async generate(request: LifestyleRequest): Promise<string[]> {
    const { productAssetId, environmentId, mood, composition, styleId, references, model } = request;
    
    const env = environmentReferenceService.getById(environmentId);
    let prompt = `Lifestyle product photography`;
    
    if (env) {
      prompt += ` in ${env.name}`;
      if (env.description) {
        prompt += ` - ${env.description}`;
      }
    }
    
    if (mood) prompt += `, ${mood} mood`;
    if (composition) prompt += `, ${composition} composition`;
    
    if (styleId) {
      const style = styleService.getById(styleId);
      if (style) {
        prompt += `, ${style.visualDescription}`;
      }
    }

    const images = await aiService.generateProductPhoto({
      projectId: request.projectId,
      productAssetId,
      goal: prompt,
      style: styleId ? styleService.getById(styleId)?.name : undefined,
      background: env?.name,
      model,
    });

    // Save generation
    const generation: Generation = {
      id: uuidv4(),
      projectId: request.projectId,
      type: 'lifestyle',
      status: 'completed',
      prompt,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGeneration(generation);

    if (images.length > 0) {
      const version = {
        id: uuidv4(),
        generationId: generation.id,
        version: 1,
        imagePath: images[0],
        thumbnailPath: images[0],
        prompt,
        parameters: request as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };
      addGenerationVersion(version);
    }

    return images;
  }
}

// Advertising Service
class AdvertisingService {
  async generate(request: AdvertisingRequest): Promise<string[]> {
    const { productAssetId, objective, format, styleId, copy, references, model } = request;
    
    let prompt = `Advertising image for ${objective.replace('_', ' ')}`;
    
    if (format) prompt += `, ${format} format`;
    if (copy) prompt += `, featuring: ${copy}`;
    
    if (styleId) {
      const style = styleService.getById(styleId);
      if (style) {
        prompt += `, ${style.visualDescription}`;
      }
    }

    const images = await aiService.generateProductPhoto({
      projectId: request.projectId,
      productAssetId,
      goal: prompt,
      style: styleId ? styleService.getById(styleId)?.name : undefined,
      model,
    });

    // Save generation
    const generation: Generation = {
      id: uuidv4(),
      projectId: request.projectId,
      type: 'advertising',
      status: 'completed',
      prompt,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGeneration(generation);

    if (images.length > 0) {
      const version = {
        id: uuidv4(),
        generationId: generation.id,
        version: 1,
        imagePath: images[0],
        thumbnailPath: images[0],
        prompt,
        parameters: request as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };
      addGenerationVersion(version);
    }

    return images;
  }
}

// Product Card Service
class ProductCardService {
  async generate(request: ProductCardRequest): Promise<string[]> {
    const { productAssetId, cardType, styleId, references, model } = request;
    
    const cardTypePrompts: Record<string, string> = {
      main: 'Main product showcase image',
      features: 'Product features highlight',
      benefits: 'Product benefits visualization',
      specifications: 'Technical specifications display',
      usage: 'Product in use scenario',
      comparison: 'Product comparison visualization',
      infographic: 'Product infographic',
    };

    let prompt = cardTypePrompts[cardType] || 'Product card';
    
    if (styleId) {
      const style = styleService.getById(styleId);
      if (style) {
        prompt += `, ${style.visualDescription}`;
      }
    }

    const images = await aiService.generateProductPhoto({
      projectId: request.projectId,
      productAssetId,
      goal: prompt,
      style: styleId ? styleService.getById(styleId)?.name : undefined,
      model,
    });

    // Save generation
    const generation: Generation = {
      id: uuidv4(),
      projectId: request.projectId,
      type: 'product_card',
      status: 'completed',
      prompt,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGeneration(generation);

    if (images.length > 0) {
      const version = {
        id: uuidv4(),
        generationId: generation.id,
        version: 1,
        imagePath: images[0],
        thumbnailPath: images[0],
        prompt,
        parameters: request as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };
      addGenerationVersion(version);
    }

    return images;
  }

  async generateFunnel(plan: CardFunnelPlan): Promise<BatchJob> {
    const batch: BatchJob = {
      id: uuidv4(),
      name: `Card Funnel - ${plan.cards.filter(c => c.enabled).length} cards`,
      type: 'product_card',
      items: plan.cards.filter(c => c.enabled).map(card => ({
        id: uuidv4(),
        batchId: '',
        input: {
          projectId: plan.projectId,
          productAssetId: plan.productAssetId,
          cardType: card.type,
          styleId: card.styleId || plan.styleId,
        },
        status: 'pending' as const,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    batch.items.forEach(item => item.batchId = batch.id);

    // Add to queue
    generationQueue.addJob('image_generation', batch);

    return batch;
  }
}

// Replace Product Service
class ReplaceProductService {
  async generate(request: ReplaceProductRequest): Promise<string[]> {
    const { referenceDesignId, newProductAssetId, mode, styleId, model } = request;
    
    const modePrompts: Record<string, string> = {
      COPY: 'Exact copy of the reference design with new product',
      ADAPT: 'Adapted version of the reference design with new product',
      CONCEPT: 'Concept inspired by the reference design with new product',
    };

    let prompt = modePrompts[mode] || 'Replace product in design';
    
    if (styleId) {
      const style = styleService.getById(styleId);
      if (style) {
        prompt += `, ${style.visualDescription}`;
      }
    }

    const images = await aiService.generateProductPhoto({
      projectId: request.projectId,
      productAssetId: newProductAssetId,
      goal: prompt,
      style: styleId ? styleService.getById(styleId)?.name : undefined,
      model,
    });

    // Save generation
    const generation: Generation = {
      id: uuidv4(),
      projectId: request.projectId,
      type: 'product_photo',
      status: 'completed',
      prompt,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGeneration(generation);

    if (images.length > 0) {
      const version = {
        id: uuidv4(),
        generationId: generation.id,
        version: 1,
        imagePath: images[0],
        thumbnailPath: images[0],
        prompt,
        parameters: request as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };
      addGenerationVersion(version);
    }

    return images;
  }
}

// Video Service
class VideoService {
  async generate(request: VideoRequest): Promise<string> {
    // Check if provider supports video
    const { capabilityService } = await import('./ai');
    const model = request.model || 'default-video-model';
    const supported = await capabilityService.isSupported(model, 'VIDEO_GENERATION');
    
    if (!supported) {
      throw new Error(`Model ${model} does not support video generation. Please select a different model.`);
    }

    // In production, this would call the actual video generation API
    // For now, return a placeholder
    throw new Error('Video generation not yet available. This feature requires a provider with video generation support.');
  }
}

// Scenario Service
class ScenarioService {
  async createPlan(projectId: string, description: string): Promise<ScenarioPlan> {
    // Use AI to generate scenario plan
    const prompt = `Create a structured scenario plan for: ${description}\n\nProvide scenes as JSON array with id, description, type (image/video/text), and parameters.`;
    
    const response = await aiService.generateAIText({
      type: 'CUSTOM',
      customInstructions: prompt,
    });

    // Parse response (simplified)
    const scenes: ScenarioScene[] = [
      {
        id: uuidv4(),
        description: 'Opening scene',
        type: 'image',
        parameters: {},
      },
      {
        id: uuidv4(),
        description: 'Main showcase',
        type: 'image',
        parameters: {},
      },
    ];

    const plan: ScenarioPlan = {
      id: uuidv4(),
      projectId,
      name: 'AI Generated Scenario',
      description,
      scenes,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    return plan;
  }

  async executePlan(plan: ScenarioPlan): Promise<void> {
    if (plan.status !== 'approved') {
      throw new Error('Plan must be approved before execution');
    }

    // Queue all scenes
    for (const scene of plan.scenes) {
      generationQueue.addJob(scene.type === 'video' ? 'image_generation' : 'image_generation', {
        projectId: plan.projectId,
        goal: scene.description,
        ...scene.parameters,
      });
    }

    // Update plan status
    plan.status = 'processing';
  }
}

// Batch Service
class BatchService {
  async createBatch(name: string, type: BatchJob['type'], items: any[]): Promise<BatchJob> {
    const batch: BatchJob = {
      id: uuidv4(),
      name,
      type,
      items: items.map(item => ({
        id: uuidv4(),
        batchId: '',
        input: item,
        status: 'pending' as const,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    batch.items.forEach(item => item.batchId = batch.id);

    // Add to queue
    generationQueue.addJob('image_generation', batch);

    return batch;
  }

  pauseBatch(batchId: string): void {
    generationQueue.pause();
  }

  resumeBatch(batchId: string): void {
    generationQueue.resume();
  }

  cancelBatch(batchId: string): void {
    // Cancel all jobs in batch
    const jobs = generationQueue.getJobs();
    jobs.forEach(job => {
      if ((job.request as any)?.id === batchId) {
        generationQueue.cancelJob(job.id);
      }
    });
  }

  retryFailed(batchId: string): void {
    generationQueue.retryAllFailed();
  }
}

// Editor Service
const EDITOR_DOCS_KEY = 'ai-studio-editor-documents';

class EditorService {
  private documents: EditorDocument[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(EDITOR_DOCS_KEY);
    if (stored) {
      try {
        this.documents = JSON.parse(stored);
      } catch {
        this.documents = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(EDITOR_DOCS_KEY, JSON.stringify(this.documents));
  }

  getAll(projectId?: string): EditorDocument[] {
    if (projectId) {
      return this.documents.filter(doc => doc.projectId === projectId);
    }
    return [...this.documents];
  }

  getById(id: string): EditorDocument | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  create(projectId: string, name: string, width: number, height: number): EditorDocument {
    const now = new Date().toISOString();
    const doc: EditorDocument = {
      id: uuidv4(),
      projectId,
      name,
      width,
      height,
      layers: [],
      createdAt: now,
      updatedAt: now,
    };
    this.documents.push(doc);
    this.saveToStorage();
    return doc;
  }

  update(id: string, updates: Partial<EditorDocument>): EditorDocument | undefined {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return undefined;

    this.documents[index] = {
      ...this.documents[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.documents[index];
  }

  addLayer(docId: string, layer: Omit<EditorLayer, 'id'>): EditorLayer | undefined {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return undefined;

    const newLayer: EditorLayer = {
      ...layer,
      id: uuidv4(),
    };

    doc.layers.push(newLayer);
    doc.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return newLayer;
  }

  updateLayer(docId: string, layerId: string, updates: Partial<EditorLayer>): EditorLayer | undefined {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return undefined;

    const layerIndex = doc.layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return undefined;

    doc.layers[layerIndex] = {
      ...doc.layers[layerIndex],
      ...updates,
    };
    doc.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return doc.layers[layerIndex];
  }

  deleteLayer(docId: string, layerId: string): boolean {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return false;

    const initialLength = doc.layers.length;
    doc.layers = doc.layers.filter(l => l.id !== layerId);
    const deleted = doc.layers.length < initialLength;
    
    if (deleted) {
      doc.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
    return deleted;
  }

  delete(id: string): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.id !== id);
    const deleted = this.documents.length < initialLength;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  export(docId: string, format: 'png' | 'jpeg' | 'webp'): string | null {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return null;

    // In production, this would render the document to canvas and export
    // For now, return a placeholder
    return null;
  }
}

export const tryOnService = new TryOnService();
export const lifestyleService = new LifestyleService();
export const advertisingService = new AdvertisingService();
export const productCardService = new ProductCardService();
export const replaceProductService = new ReplaceProductService();
export const videoService = new VideoService();
export const scenarioService = new ScenarioService();
export const batchService = new BatchService();
export const editorService = new EditorService();
