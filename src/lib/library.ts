// Library Service - Manages library items (models, environments, design references, styles, templates)

import type { LibraryItemExtended, LibraryItemType } from './contracts';
import { v4 as uuidv4 } from 'uuid';

const LIBRARY_STORAGE_KEY = 'ai-studio-library';

class LibraryService {
  private items: LibraryItemExtended[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch {
        this.items = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(this.items));
  }

  getAll(type?: LibraryItemType): LibraryItemExtended[] {
    if (type) {
      return this.items.filter(item => item.type === type);
    }
    return [...this.items];
  }

  getById(id: string): LibraryItemExtended | undefined {
    return this.items.find(item => item.id === id);
  }

  create(item: Omit<LibraryItemExtended, 'id' | 'createdAt' | 'updatedAt'>): LibraryItemExtended {
    const now = new Date().toISOString();
    const newItem: LibraryItemExtended = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  update(id: string, updates: Partial<LibraryItemExtended>): LibraryItemExtended | undefined {
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

  toggleFavorite(id: string): LibraryItemExtended | undefined {
    const item = this.items.find(i => i.id === id);
    if (!item) return undefined;
    return this.update(id, { favorite: !item.favorite });
  }

  search(query: string, type?: LibraryItemType): LibraryItemExtended[] {
    const q = query.toLowerCase();
    let results = this.items;
    
    if (type) {
      results = results.filter(item => item.type === type);
    }

    return results.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  getByTag(tag: string, type?: LibraryItemType): LibraryItemExtended[] {
    let results = this.items;
    if (type) {
      results = results.filter(item => item.type === type);
    }
    return results.filter(item => item.tags.includes(tag));
  }

  getAllTags(type?: LibraryItemType): string[] {
    let items = this.items;
    if (type) {
      items = items.filter(item => item.type === type);
    }
    const tags = new Set<string>();
    items.forEach(item => item.tags.forEach((tag: string) => tags.add(tag)));
    return Array.from(tags).sort();
  }
}

export const libraryService = new LibraryService();
