// Provider Registry - Manages AI providers

import type { AIProvider } from './provider';
import { OpenRouterProvider } from './openrouter';
import { MockAIProvider } from './mock-provider';

class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private activeProviderId: string = 'openrouter';

  constructor() {
    // Register built-in providers
    this.register(new OpenRouterProvider());
    this.register(new MockAIProvider());
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): void {
    this.providers.delete(id);
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getActive(): AIProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      throw new Error(`Active provider ${this.activeProviderId} not found`);
    }
    return provider;
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not found`);
    }
    this.activeProviderId = id;
  }

  getActiveId(): string {
    return this.activeProviderId;
  }
}

export const providerRegistry = new ProviderRegistry();
