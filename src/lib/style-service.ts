// Style Service - Manages visual styles for generations

import type { Style } from './contracts';
import { v4 as uuidv4 } from 'uuid';

const STYLES_STORAGE_KEY = 'ai-studio-styles';

class StyleService {
  private styles: Style[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultStyles();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STYLES_STORAGE_KEY);
    if (stored) {
      try {
        this.styles = JSON.parse(stored);
      } catch {
        this.styles = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(this.styles));
  }

  private initializeDefaultStyles(): void {
    if (this.styles.length === 0) {
      const now = new Date().toISOString();
      
      // Default styles
      const defaults: Omit<Style, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Minimalist',
          description: 'Clean, simple, modern aesthetic',
          references: [],
          visualDescription: 'White space, simple lines, minimal decoration',
          colors: ['#ffffff', '#000000', '#f5f5f5'],
          typographyHints: 'Sans-serif, clean fonts',
          layoutHints: 'Centered, balanced, lots of white space',
          aiInstructions: 'Create a minimalist design with clean lines, plenty of white space, and a modern aesthetic. Use simple typography and avoid clutter.',
          favorite: false,
        },
        {
          name: 'Luxury',
          description: 'Premium, elegant, sophisticated',
          references: [],
          visualDescription: 'Rich materials, gold accents, deep colors',
          colors: ['#1a1a1a', '#d4af37', '#2c2c2c', '#8b7355'],
          typographyHints: 'Serif fonts, elegant spacing',
          layoutHints: 'Symmetrical, refined, premium feel',
          aiInstructions: 'Create a luxury design with rich materials, elegant details, and a premium feel. Use sophisticated color palettes and refined typography.',
          favorite: false,
        },
        {
          name: 'Vibrant',
          description: 'Bold, colorful, energetic',
          references: [],
          visualDescription: 'Bright colors, dynamic compositions, playful elements',
          colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'],
          typographyHints: 'Bold, playful fonts',
          layoutHints: 'Dynamic, asymmetric, eye-catching',
          aiInstructions: 'Create a vibrant design with bold colors, dynamic compositions, and energetic elements. Use playful typography and eye-catching layouts.',
          favorite: false,
        },
        {
          name: 'Natural',
          description: 'Organic, earthy, sustainable',
          references: [],
          visualDescription: 'Earth tones, natural textures, organic shapes',
          colors: ['#8b7355', '#a0826d', '#c9b29c', '#6b8e23'],
          typographyHints: 'Clean, readable fonts',
          layoutHints: 'Organic flow, natural balance',
          aiInstructions: 'Create a natural design with earth tones, organic shapes, and sustainable aesthetics. Use natural textures and balanced compositions.',
          favorite: false,
        },
        {
          name: 'Tech',
          description: 'Modern, futuristic, innovative',
          references: [],
          visualDescription: 'Dark backgrounds, neon accents, geometric patterns',
          colors: ['#0a0a0a', '#00ff88', '#0066ff', '#ff00ff'],
          typographyHints: 'Monospace, technical fonts',
          layoutHints: 'Grid-based, precise, structured',
          aiInstructions: 'Create a tech-inspired design with dark backgrounds, neon accents, and geometric patterns. Use modern typography and structured layouts.',
          favorite: false,
        },
      ];

      defaults.forEach(style => {
        this.styles.push({
          ...style,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        });
      });

      this.saveToStorage();
    }
  }

  getAll(): Style[] {
    return [...this.styles];
  }

  getById(id: string): Style | undefined {
    return this.styles.find(style => style.id === id);
  }

  create(style: Omit<Style, 'id' | 'createdAt' | 'updatedAt'>): Style {
    const now = new Date().toISOString();
    const newStyle: Style = {
      ...style,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.styles.push(newStyle);
    this.saveToStorage();
    return newStyle;
  }

  update(id: string, updates: Partial<Style>): Style | undefined {
    const index = this.styles.findIndex(style => style.id === id);
    if (index === -1) return undefined;

    this.styles[index] = {
      ...this.styles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.styles[index];
  }

  delete(id: string): boolean {
    const initialLength = this.styles.length;
    this.styles = this.styles.filter(style => style.id !== id);
    const deleted = this.styles.length < initialLength;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  toggleFavorite(id: string): Style | undefined {
    const style = this.styles.find(s => s.id === id);
    if (!style) return undefined;
    return this.update(id, { favorite: !style.favorite });
  }

  search(query: string): Style[] {
    const q = query.toLowerCase();
    return this.styles.filter(style =>
      style.name.toLowerCase().includes(q) ||
      style.description?.toLowerCase().includes(q) ||
      style.visualDescription.toLowerCase().includes(q) ||
      style.colors.some(color => color.toLowerCase().includes(q))
    );
  }

  buildPromptInstructions(style: Style): string {
    let instructions = style.aiInstructions;
    
    if (style.colors.length > 0) {
      instructions += `\n\nColor palette: ${style.colors.join(', ')}`;
    }
    
    if (style.typographyHints) {
      instructions += `\n\nTypography: ${style.typographyHints}`;
    }
    
    if (style.layoutHints) {
      instructions += `\n\nLayout: ${style.layoutHints}`;
    }
    
    return instructions;
  }
}

export const styleService = new StyleService();
