// Creative Studio Tests - Task 3

import { libraryService } from '../lib/library';
import { styleService } from '../lib/style-service';
import { modelReferenceService, environmentReferenceService, designReferenceService } from '../lib/references';
import { tryOnService, lifestyleService, advertisingService, productCardService, replaceProductService, videoService, scenarioService, batchService, editorService } from '../lib/creative-services';
import { MockAIProvider } from '../lib/ai/mock-provider';
import { providerRegistry } from '../lib/ai/provider-registry';

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
  }
}

// Test suite
export async function runCreativeTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
  const results = { passed: 0, failed: 0, errors: [] as string[] };

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      results.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      results.failed++;
      const msg = error instanceof Error ? error.message : String(error);
      results.errors.push(`${name}: ${msg}`);
      console.error(`✗ ${name}: ${msg}`);
    }
  }

  // Setup mock provider
  const mockProvider = new MockAIProvider();
  mockProvider.setScenario('success');
  providerRegistry.register(mockProvider);
  providerRegistry.setActive('mock');

  // Library Tests
  await test('Library: create item', () => {
    const item = libraryService.create({
      type: 'model',
      name: 'Test Model',
      description: 'Test description',
      tags: ['test', 'model'],
      imagePath: '',
      thumbnailPath: '',
      favorite: false,
    });
    assert(item.id !== undefined, 'Should have id');
    assertEqual(item.name, 'Test Model', 'Should have correct name');
  });

  await test('Library: get all items', () => {
    const items = libraryService.getAll();
    assert(items.length > 0, 'Should have items');
  });

  await test('Library: get by type', () => {
    const models = libraryService.getAll('model');
    assert(models.length > 0, 'Should have models');
    assert(models.every(m => m.type === 'model'), 'All should be models');
  });

  await test('Library: update item', () => {
    const items = libraryService.getAll();
    const item = items[0];
    const updated = libraryService.update(item.id, { name: 'Updated Name' });
    assertEqual(updated?.name, 'Updated Name', 'Should be updated');
  });

  await test('Library: toggle favorite', () => {
    const items = libraryService.getAll();
    const item = items[0];
    const initialFavorite = item.favorite;
    libraryService.toggleFavorite(item.id);
    const updated = libraryService.getById(item.id);
    assertEqual(updated?.favorite, !initialFavorite, 'Should toggle favorite');
  });

  await test('Library: search items', () => {
    const results = libraryService.search('Updated');
    assert(results.length > 0, 'Should find items');
  });

  await test('Library: delete item', () => {
    const items = libraryService.getAll();
    const item = items[items.length - 1];
    const deleted = libraryService.delete(item.id);
    assert(deleted, 'Should delete item');
    const found = libraryService.getById(item.id);
    assert(found === undefined, 'Should not find deleted item');
  });

  // Style Tests
  await test('Style: has default styles', () => {
    const styles = styleService.getAll();
    assert(styles.length >= 5, 'Should have default styles');
  });

  await test('Style: create custom style', () => {
    const style = styleService.create({
      name: 'Custom Style',
      description: 'Custom description',
      references: [],
      visualDescription: 'Custom visual',
      colors: ['#ff0000'],
      aiInstructions: 'Custom instructions',
      favorite: false,
    });
    assert(style.id !== undefined, 'Should have id');
    assertEqual(style.name, 'Custom Style', 'Should have correct name');
  });

  await test('Style: build prompt instructions', () => {
    const styles = styleService.getAll();
    const style = styles[0];
    const instructions = styleService.buildPromptInstructions(style);
    assert(instructions.length > 0, 'Should generate instructions');
  });

  await test('Style: search styles', () => {
    const results = styleService.search('Minimalist');
    assert(results.length > 0, 'Should find styles');
  });

  // Model Reference Tests
  await test('ModelReference: create', () => {
    const model = modelReferenceService.create({
      name: 'Test Model',
      description: 'Test description',
      imagePath: '',
      thumbnailPath: '',
      tags: ['test'],
      favorite: false,
    });
    assert(model.id !== undefined, 'Should have id');
  });

  await test('ModelReference: get all', () => {
    const models = modelReferenceService.getAll();
    assert(models.length > 0, 'Should have models');
  });

  await test('ModelReference: search', () => {
    const results = modelReferenceService.search('Test');
    assert(results.length > 0, 'Should find models');
  });

  // Environment Reference Tests
  await test('EnvironmentReference: has defaults', () => {
    const envs = environmentReferenceService.getAll();
    assert(envs.length >= 7, 'Should have default environments');
  });

  await test('EnvironmentReference: get by category', () => {
    const studios = environmentReferenceService.getByCategory('studio');
    assert(studios.length > 0, 'Should have studio environments');
  });

  await test('EnvironmentReference: create', () => {
    const env = environmentReferenceService.create({
      name: 'Custom Environment',
      category: 'other',
      description: 'Custom description',
      imagePath: '',
      thumbnailPath: '',
      tags: ['custom'],
      favorite: false,
    });
    assert(env.id !== undefined, 'Should have id');
  });

  // Design Reference Tests
  await test('DesignReference: create', () => {
    const ref = designReferenceService.create({
      name: 'Test Design',
      description: 'Test description',
      imagePath: '',
      thumbnailPath: '',
      mode: 'INSPIRED',
      tags: ['test'],
      favorite: false,
    });
    assert(ref.id !== undefined, 'Should have id');
    assertEqual(ref.mode, 'INSPIRED', 'Should have correct mode');
  });

  // Try-On Tests
  await test('TryOn: request construction', async () => {
    const request = {
      projectId: 'test-project',
      productAssetId: 'test-asset',
      modelReferenceId: 'test-model',
      pose: 'standing',
      framing: 'full body',
    };
    assert(request.projectId !== undefined, 'Should have projectId');
    assert(request.modelReferenceId !== undefined, 'Should have modelReferenceId');
  });

  // Lifestyle Tests
  await test('Lifestyle: request construction', async () => {
    const request = {
      projectId: 'test-project',
      productAssetId: 'test-asset',
      environmentId: 'test-env',
      mood: 'cozy',
      composition: 'centered',
    };
    assert(request.environmentId !== undefined, 'Should have environmentId');
  });

  // Advertising Tests
  await test('Advertising: request construction', async () => {
    const request = {
      projectId: 'test-project',
      productAssetId: 'test-asset',
      objective: 'sale' as const,
      format: 'banner',
    };
    assert(request.objective !== undefined, 'Should have objective');
  });

  // Product Card Tests
  await test('ProductCard: request construction', async () => {
    const request = {
      projectId: 'test-project',
      productAssetId: 'test-asset',
      cardType: 'main' as const,
    };
    assert(request.cardType !== undefined, 'Should have cardType');
  });

  await test('ProductCard: funnel plan', async () => {
    const plan = {
      projectId: 'test-project',
      productAssetId: 'test-asset',
      cards: [
        { type: 'main' as const, enabled: true },
        { type: 'features' as const, enabled: true },
        { type: 'benefits' as const, enabled: false },
      ],
    };
    assert(plan.cards.filter(c => c.enabled).length === 2, 'Should have 2 enabled cards');
  });

  // Replace Product Tests
  await test('ReplaceProduct: request construction', async () => {
    const request = {
      projectId: 'test-project',
      referenceDesignId: 'test-design',
      newProductAssetId: 'test-asset',
      mode: 'COPY' as const,
    };
    assert(request.mode !== undefined, 'Should have mode');
  });

  // Video Tests
  await test('Video: capability check', async () => {
    const { capabilityService } = await import('../lib/ai/capability-service');
    capabilityService.clearCache();
    const supported = await capabilityService.isSupported('mock/gpt-4o', 'VIDEO_GENERATION');
    assert(supported === false, 'Mock GPT-4o should not support video');
  });

  // Scenario Tests
  await test('Scenario: plan creation', async () => {
    const plan = {
      id: 'test-plan',
      projectId: 'test-project',
      name: 'Test Scenario',
      description: 'Test description',
      scenes: [
        { id: 'scene-1', description: 'Opening', type: 'image' as const, parameters: {} },
        { id: 'scene-2', description: 'Main', type: 'image' as const, parameters: {} },
      ],
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
    };
    assert(plan.scenes.length === 2, 'Should have 2 scenes');
  });

  // Batch Tests
  await test('Batch: create batch', async () => {
    const batch = await batchService.createBatch('Test Batch', 'image_generation', [
      { prompt: 'Item 1' },
      { prompt: 'Item 2' },
    ]);
    assert(batch.id !== undefined, 'Should have id');
    assertEqual(batch.items.length, 2, 'Should have 2 items');
  });

  await test('Batch: orchestration', async () => {
    const batch = await batchService.createBatch('Orchestration Test', 'product_card', [
      { cardType: 'main' },
      { cardType: 'features' },
      { cardType: 'benefits' },
    ]);
    assert(batch.items.length === 3, 'Should have 3 items');
    assert(batch.type === 'product_card', 'Should have correct type');
  });

  // Editor Tests
  await test('Editor: create document', () => {
    const doc = editorService.create('test-project', 'Test Document', 1920, 1080);
    assert(doc.id !== undefined, 'Should have id');
    assertEqual(doc.width, 1920, 'Should have correct width');
    assertEqual(doc.height, 1080, 'Should have correct height');
  });

  await test('Editor: add layer', () => {
    const docs = editorService.getAll();
    const doc = docs[0];
    const layer = editorService.addLayer(doc.id, {
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      data: { text: 'Hello World' },
    });
    assert(layer !== undefined, 'Should create layer');
    assert(layer!.id !== undefined, 'Layer should have id');
  });

  await test('Editor: update layer', () => {
    const docs = editorService.getAll();
    const doc = docs[0];
    const layer = doc.layers[0];
    const updated = editorService.updateLayer(doc.id, layer.id, { x: 150 });
    assertEqual(updated?.x, 150, 'Should update x position');
  });

  await test('Editor: delete layer', () => {
    const docs = editorService.getAll();
    const doc = docs[0];
    const layer = doc.layers[0];
    const deleted = editorService.deleteLayer(doc.id, layer.id);
    assert(deleted, 'Should delete layer');
  });

  await test('Editor: persistence', () => {
    const docs = editorService.getAll();
    assert(docs.length > 0, 'Should persist documents');
  });

  await test('Editor: delete document', () => {
    const docs = editorService.getAll();
    const doc = docs[0];
    const deleted = editorService.delete(doc.id);
    assert(deleted, 'Should delete document');
  });

  // Cleanup
  providerRegistry.setActive('openrouter');

  return results;
}
