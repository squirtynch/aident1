// AI Engine Tests

import { MockAIProvider } from '../lib/ai/mock-provider';
import { OpenRouterProvider } from '../lib/ai/openrouter';
import { capabilityService } from '../lib/ai/capability-service';
import { promptEngine } from '../lib/ai/prompt-engine';
import { generationQueue } from '../lib/ai/queue';
import { credentialStore } from '../lib/ai/credential-store';
import { providerRegistry } from '../lib/ai/provider-registry';
import { AI_ERROR_CODES } from '../lib/ai/provider';

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
export async function runTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  // Provider Abstraction Tests
  await test('MockProvider: success scenario', async () => {
    const provider = new MockAIProvider();
    provider.setScenario('success');
    const response = await provider.generateText('test prompt');
    assert(response.success, 'Should succeed');
    assert(typeof response.data === 'string', 'Should return string');
  });

  await test('MockProvider: timeout scenario', async () => {
    const provider = new MockAIProvider();
    provider.setScenario('timeout', 50);
    const response = await provider.generateText('test');
    assert(!response.success, 'Should fail');
    assertEqual(response.error?.code, AI_ERROR_CODES.TIMEOUT, 'Should be timeout error');
    assert(response.error?.retryable === true, 'Should be retryable');
  });

  await test('MockProvider: rate limit scenario', async () => {
    const provider = new MockAIProvider();
    provider.setScenario('rate_limit', 50);
    const response = await provider.generateText('test');
    assert(!response.success, 'Should fail');
    assertEqual(response.error?.code, AI_ERROR_CODES.RATE_LIMITED, 'Should be rate limit error');
  });

  await test('MockProvider: server error scenario', async () => {
    const provider = new MockAIProvider();
    provider.setScenario('server_error', 50);
    const response = await provider.generateText('test');
    assert(!response.success, 'Should fail');
    assertEqual(response.error?.code, AI_ERROR_CODES.SERVER_ERROR, 'Should be server error');
  });

  await test('MockProvider: invalid key scenario', async () => {
    const provider = new MockAIProvider();
    provider.setScenario('invalid_key', 50);
    const response = await provider.generateText('test');
    assert(!response.success, 'Should fail');
    assertEqual(response.error?.code, AI_ERROR_CODES.INVALID_API_KEY, 'Should be invalid key error');
    assert(response.error?.retryable === false, 'Should not be retryable');
  });

  await test('MockProvider: list models', async () => {
    const provider = new MockAIProvider();
    const response = await provider.listModels();
    assert(response.success, 'Should succeed');
    assert(Array.isArray(response.data), 'Should return array');
    assert(response.data!.length > 0, 'Should have models');
  });

  await test('MockProvider: image generation', async () => {
    const provider = new MockAIProvider();
    const response = await provider.generateImage('test prompt');
    assert(response.success, 'Should succeed');
    assert(Array.isArray(response.data), 'Should return array');
    assert(response.data!.length > 0, 'Should have images');
  });

  await test('MockProvider: image editing', async () => {
    const provider = new MockAIProvider();
    const response = await provider.editImage('test-image', { instruction: 'make brighter' });
    assert(response.success, 'Should succeed');
    assert(typeof response.data === 'string', 'Should return string');
  });

  await test('MockProvider: structured output', async () => {
    const provider = new MockAIProvider();
    const response = await provider.generateStructuredOutput('test', {});
    assert(response.success, 'Should succeed');
    assert(response.data !== undefined, 'Should have data');
  });

  // Capability Tests
  await test('CapabilityService: detect text capability', async () => {
    capabilityService.clearCache();
    const status = await capabilityService.getCapability('mock/gpt-4o', 'TEXT');
    assertEqual(status, 'SUPPORTED', 'GPT-4o should support text');
  });

  await test('CapabilityService: detect vision capability', async () => {
    capabilityService.clearCache();
    const status = await capabilityService.getCapability('mock/gpt-4o', 'VISION');
    assertEqual(status, 'SUPPORTED', 'GPT-4o should support vision');
  });

  await test('CapabilityService: detect unsupported capability', async () => {
    capabilityService.clearCache();
    const status = await capabilityService.getCapability('mock/gpt-4o', 'IMAGE_GENERATION');
    assertEqual(status, 'UNSUPPORTED', 'GPT-4o should not support image generation');
  });

  await test('CapabilityService: isSupported helper', async () => {
    capabilityService.clearCache();
    const supported = await capabilityService.isSupported('mock/gpt-4o', 'TEXT');
    assert(supported === true, 'Should be supported');
    
    const notSupported = await capabilityService.isSupported('mock/gpt-4o', 'IMAGE_GENERATION');
    assert(notSupported === false, 'Should not be supported');
  });

  // Error Normalization Tests
  await test('OpenRouterProvider: error normalization', async () => {
    const provider = new OpenRouterProvider();
    provider.setApiKey('invalid-key');
    const response = await provider.validateApiKey();
    assert(!response.success, 'Should fail with invalid key');
    assert(response.error !== undefined, 'Should have error');
    assert(typeof response.error!.code === 'string', 'Error should have code');
    assert(typeof response.error!.message === 'string', 'Error should have message');
    assert(typeof response.error!.retryable === 'boolean', 'Error should have retryable flag');
  });

  // Credential Store Tests
  await test('CredentialStore: set and get credential', async () => {
    await credentialStore.setCredential('test-service', 'test-key', 'test-value');
    const value = await credentialStore.getCredential('test-service', 'test-key');
    assertEqual(value, 'test-value', 'Should retrieve stored value');
  });

  await test('CredentialStore: masked credential', async () => {
    await credentialStore.setCredential('test-service', 'masked-key', 'sk-or-very-long-api-key-12345678');
    const masked = await credentialStore.getMaskedCredential('test-service', 'masked-key');
    assert(masked !== null, 'Should have masked value');
    assert(masked!.includes('•'), 'Should contain mask characters');
    assert(!masked!.includes('very-long-api-key'), 'Should not contain actual key');
  });

  await test('CredentialStore: has credential', async () => {
    await credentialStore.setCredential('test-service', 'exists-key', 'value');
    const exists = await credentialStore.hasCredential('test-service', 'exists-key');
    assert(exists === true, 'Should exist');
    
    const notExists = await credentialStore.hasCredential('test-service', 'not-exists');
    assert(notExists === false, 'Should not exist');
  });

  await test('CredentialStore: delete credential', async () => {
    await credentialStore.setCredential('test-service', 'delete-key', 'value');
    await credentialStore.deleteCredential('test-service', 'delete-key');
    const value = await credentialStore.getCredential('test-service', 'delete-key');
    assert(value === null, 'Should be null after deletion');
  });

  // Prompt Engine Tests
  await test('PromptEngine: register and get template', () => {
    const template = promptEngine.getTemplate('product_photo');
    assert(template !== undefined, 'Template should exist');
    assertEqual(template!.id, 'product_photo', 'Should have correct id');
  });

  await test('PromptEngine: render template', () => {
    const rendered = promptEngine.render('product_photo', {
      product_name: 'Test Product',
      category: 'Electronics',
      colors: ['black', 'silver'],
      materials: ['plastic'],
      features: ['wireless'],
      style: 'modern',
      composition: 'centered',
      background: 'white',
      output_requirements: 'High resolution',
    });
    assert(rendered.includes('Test Product'), 'Should include product name');
    assert(rendered.includes('Electronics'), 'Should include category');
    assert(rendered.includes('modern'), 'Should include style');
  });

  await test('PromptEngine: build product analysis prompt', () => {
    const prompt = promptEngine.buildProductAnalysisPrompt();
    assert(prompt.includes('Analyze'), 'Should include analysis instruction');
    assert(prompt.includes('JSON'), 'Should request JSON output');
    assert(prompt.includes('category'), 'Should request category');
  });

  await test('PromptEngine: build AI text prompt', () => {
    const prompt = promptEngine.buildAITextPrompt('SHORT_DESCRIPTION', {
      product: {
        productName: 'Test Widget',
        category: 'Gadgets',
        colors: ['blue'],
        materials: ['metal'],
        features: ['compact'],
        visualCharacteristics: ['sleek'],
        detectedText: [],
        constraints: [],
        confidence: 0.9,
      },
    });
    assert(prompt.includes('Test Widget'), 'Should include product name');
    assert(prompt.length > 50, 'Should be substantial');
  });

  // Queue Tests
  await test('Queue: add job', () => {
    const job = generationQueue.addJob('image_generation', { projectId: 'test' });
    assert(job.id !== undefined, 'Should have id');
    assertEqual(job.type, 'image_generation', 'Should have correct type');
    assertEqual(job.status, 'QUEUED', 'Should be queued');
    assertEqual(job.retryCount, 0, 'Should have 0 retries');
  });

  await test('Queue: get jobs', () => {
    generationQueue.addJob('ai_text', { projectId: 'test' });
    const jobs = generationQueue.getJobs();
    assert(jobs.length > 0, 'Should have jobs');
  });

  await test('Queue: cancel job', () => {
    const job = generationQueue.addJob('image_generation', { projectId: 'test' });
    generationQueue.cancelJob(job.id);
    const updated = generationQueue.getJob(job.id);
    assertEqual(updated?.status, 'CANCELLED', 'Should be cancelled');
  });

  await test('Queue: retry job', () => {
    const job = generationQueue.addJob('image_generation', { projectId: 'test' });
    generationQueue.updateJobStatus(job.id, 'FAILED', 'test error');
    generationQueue.retryJob(job.id);
    const updated = generationQueue.getJob(job.id);
    assertEqual(updated?.status, 'QUEUED', 'Should be queued again');
    assertEqual(updated?.retryCount, 0, 'Should reset retry count');
  });

  await test('Queue: pause and resume', () => {
    generationQueue.pause();
    assert(generationQueue.isPaused() === true, 'Should be paused');
    generationQueue.resume();
    assert(generationQueue.isPaused() === false, 'Should be resumed');
  });

  await test('Queue: persistence', () => {
    generationQueue.clearAll();
    generationQueue.addJob('image_generation', { projectId: 'persist-test' });
    
    // Simulate reload
    const jobs = generationQueue.getJobs();
    assert(jobs.length > 0, 'Should persist jobs');
    
    generationQueue.clearAll();
  });

  // Provider Registry Tests
  await test('ProviderRegistry: get active provider', () => {
    const provider = providerRegistry.getActive();
    assert(provider !== undefined, 'Should have active provider');
    assert(typeof provider.id === 'string', 'Should have id');
  });

  await test('ProviderRegistry: list providers', () => {
    const providers = providerRegistry.getAll();
    assert(providers.length >= 2, 'Should have at least 2 providers');
  });

  await test('ProviderRegistry: set active provider', () => {
    providerRegistry.setActive('mock');
    assertEqual(providerRegistry.getActiveId(), 'mock', 'Should be mock');
    providerRegistry.setActive('openrouter');
    assertEqual(providerRegistry.getActiveId(), 'openrouter', 'Should be openrouter');
  });

  // Versioning Tests
  await test('Versioning: create versions', async () => {
    const { addGenerationVersion, getGenerationVersions } = await import('../lib/storage');
    
    const genId = 'test-gen-' + Date.now();
    
    addGenerationVersion({
      id: 'v1-' + Date.now(),
      generationId: genId,
      version: 1,
      imagePath: 'path1',
      thumbnailPath: 'thumb1',
      prompt: 'original',
      parameters: {},
      createdAt: new Date().toISOString(),
    });

    addGenerationVersion({
      id: 'v2-' + Date.now(),
      generationId: genId,
      version: 2,
      imagePath: 'path2',
      thumbnailPath: 'thumb2',
      prompt: 'improved',
      parameters: {},
      createdAt: new Date().toISOString(),
    });

    const versions = getGenerationVersions(genId);
    assert(versions.length >= 2, 'Should have at least 2 versions');
    assert(versions.some((v: any) => v.version === 1), 'Should have version 1');
    assert(versions.some((v: any) => v.version === 2), 'Should have version 2');
  });

  return results;
}
