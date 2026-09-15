// Capability Service - Resolves model capabilities

import type { Capability, CapabilityStatus, AIModel } from '../contracts';
import { providerRegistry } from './provider-registry';

class CapabilityService {
  private capabilityCache: Map<string, Map<Capability, CapabilityStatus>> = new Map();

  async getCapability(modelId: string, capability: Capability): Promise<CapabilityStatus> {
    // Check cache first
    const modelCache = this.capabilityCache.get(modelId);
    if (modelCache?.has(capability)) {
      return modelCache.get(capability)!;
    }

    // Query provider
    const provider = providerRegistry.getActive();
    const status = await provider.getCapability(modelId, capability);

    // Cache result
    if (!this.capabilityCache.has(modelId)) {
      this.capabilityCache.set(modelId, new Map());
    }
    this.capabilityCache.get(modelId)!.set(capability, status);

    return status;
  }

  async isSupported(modelId: string, capability: Capability): Promise<boolean> {
    const status = await this.getCapability(modelId, capability);
    return status === 'SUPPORTED';
  }

  async findModelForCapability(capability: Capability, preferredModel?: string): Promise<string | null> {
    const provider = providerRegistry.getActive();
    const modelsResponse = await provider.listModels();
    
    if (!modelsResponse.success || !modelsResponse.data) {
      return null;
    }

    // If preferred model is specified and supports the capability, use it
    if (preferredModel) {
      const isSupported = await this.isSupported(preferredModel, capability);
      if (isSupported) {
        return preferredModel;
      }
    }

    // Find first model that supports the capability
    for (const model of modelsResponse.data) {
      const isSupported = await this.isSupported(model.id, capability);
      if (isSupported) {
        return model.id;
      }
    }

    return null;
  }

  async getCapabilities(modelId: string): Promise<Record<Capability, CapabilityStatus>> {
    const capabilities: Record<Capability, CapabilityStatus> = {
      TEXT: 'UNKNOWN',
      VISION: 'UNKNOWN',
      IMAGE_GENERATION: 'UNKNOWN',
      IMAGE_EDITING: 'UNKNOWN',
      VIDEO_GENERATION: 'UNKNOWN',
    };

    for (const cap of Object.keys(capabilities) as Capability[]) {
      capabilities[cap] = await this.getCapability(modelId, cap);
    }

    return capabilities;
  }

  clearCache(): void {
    this.capabilityCache.clear();
  }

  clearModelCache(modelId: string): void {
    this.capabilityCache.delete(modelId);
  }
}

export const capabilityService = new CapabilityService();
