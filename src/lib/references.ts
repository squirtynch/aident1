// References Services - Model, Environment, Design References

import type { ModelReference, EnvironmentReference, DesignReference } from './contracts';
import { v4 as uuidv4 } from 'uuid';

// Model References (Person)
const MODEL_REFS_KEY = 'ai-studio-model-references';

class ModelReferenceService {
  private items: ModelReference[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(MODEL_REFS_KEY);
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch {
        this.items = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(MODEL_REFS_KEY, JSON.stringify(this.items));
  }

  getAll(): ModelReference[] {
    return [...this.items];
  }

  getById(id: string): ModelReference | undefined {
    return this.items.find(item => item.id === id);
  }

  create(item: Omit<ModelReference, 'id' | 'createdAt' | 'updatedAt'>): ModelReference {
    const now = new Date().toISOString();
    const newItem: ModelReference = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  update(id: string, updates: Partial<ModelReference>): ModelReference | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.items[index];
  }

  delete(id: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    const deleted = this.items.length < initialLength;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  toggleFavorite(id: string): ModelReference | undefined {
    const item = this.items.find(i => i.id === id);
    if (!item) return undefined;
    return this.update(id, { favorite: !item.favorite });
  }

  search(query: string): ModelReference[] {
    const q = query.toLowerCase();
    return this.items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(q))
    );
  }
}

// Environment References
const ENV_REFS_KEY = 'ai-studio-environment-references';

class EnvironmentReferenceService {
  private items: EnvironmentReference[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeDefaults();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(ENV_REFS_KEY);
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch {
        this.items = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(ENV_REFS_KEY, JSON.stringify(this.items));
  }

  private initializeDefaults(): void {
    if (this.items.length === 0) {
      const now = new Date().toISOString();
      const defaults: Omit<EnvironmentReference, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'White Studio',
          category: 'studio',
          description: 'Clean white studio background',
          imagePath: '',
          thumbnailPath: '',
          tags: ['studio', 'clean', 'white'],
          favorite: false,
        },
        {
          name: 'Modern Office',
          category: 'office',
          description: 'Contemporary office space',
          imagePath: '',
          thumbnailPath: '',
          tags: ['office', 'modern', 'professional'],
          favorite: false,
        },
        {
          name: 'Cozy Living Room',
          category: 'room',
          description: 'Warm, inviting living space',
          imagePath: '',
          thumbnailPath: '',
          tags: ['room', 'cozy', 'home'],
          favorite: false,
        },
        {
          name: 'Luxury Kitchen',
          category: 'kitchen',
          description: 'High-end kitchen interior',
          imagePath: '',
          thumbnailPath: '',
          tags: ['kitchen', 'luxury', 'modern'],
          favorite: false,
        },
        {
          name: 'Urban Street',
          category: 'street',
          description: 'City street scene',
          imagePath: '',
          thumbnailPath: '',
          tags: ['street', 'urban', 'city'],
          favorite: false,
        },
        {
          name: 'Forest Nature',
          category: 'nature',
          description: 'Natural forest setting',
          imagePath: '',
          thumbnailPath: '',
          tags: ['nature', 'forest', 'outdoor'],
          favorite: false,
        },
        {
          name: 'Luxury Interior',
          category: 'luxury',
          description: 'Premium luxury interior',
          imagePath: '',
          thumbnailPath: '',
          tags: ['luxury', 'premium', 'elegant'],
          favorite: false,
        },
      ];

      defaults.forEach(env => {
        this.items.push({
          ...env,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        });
      });

      this.saveToStorage();
    }
  }

  getAll(): EnvironmentReference[] {
    return [...this.items];
  }

  getById(id: string): EnvironmentReference | undefined {
    return this.items.find(item => item.id === id);
  }

  getByCategory(category: EnvironmentReference['category']): EnvironmentReference[] {
    return this.items.filter(item => item.category === category);
  }

  create(item: Omit<EnvironmentReference, 'id' | 'createdAt' | 'updatedAt'>): EnvironmentReference {
    const now = new Date().toISOString();
    const newItem: EnvironmentReference = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  update(id: string, updates: Partial<EnvironmentReference>): EnvironmentReference | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.items[index];
  }

  delete(id: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    const deleted = this.items.length < initialLength;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  toggleFavorite(id: string): EnvironmentReference | undefined {
    const item = this.items.find(i => i.id === id);
    if (!item) return undefined;
    return this.update(id, { favorite: !item.favorite });
  }

  search(query: string): EnvironmentReference[] {
    const q = query.toLowerCase();
    return this.items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(q))
    );
  }
}

// Design References
const DESIGN_REFS_KEY = 'ai-studio-design-references';

class DesignReferenceService {
  private items: DesignReference[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(DESIGN_REFS_KEY);
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch {
        this.items = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(DESIGN_REFS_KEY, JSON.stringify(this.items));
  }

  getAll(): DesignReference[] {
    return [...this.items];
  }

  getById(id: string): DesignReference | undefined {
    return this.items.find(item => item.id === id);
  }

  create(item: Omit<DesignReference, 'id' | 'createdAt' | 'updatedAt'>): DesignReference {
    const now = new Date().toISOString();
    const newItem: DesignReference = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  update(id: string, updates: Partial<DesignReference>): DesignReference | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.items[index];
  }

  delete(id: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    const deleted = this.items.length < initialLength;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  toggleFavorite(id: string): DesignReference | undefined {
    const item = this.items.find(i => i.id === id);
    if (!item) return undefined;
    return this.update(id, { favorite: !item.favorite });
  }

  search(query: string): DesignReference[] {
    const q = query.toLowerCase();
    return this.items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(q))
    );
  }
}

export const modelReferenceService = new ModelReferenceService();
export const environmentReferenceService = new EnvironmentReferenceService();
export const designReferenceService = new DesignReferenceService();
