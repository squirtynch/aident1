import type { ThemeMode } from './contracts';

type ThemeListener = (theme: 'light' | 'dark') => void;

class ThemeManager {
  private mode: ThemeMode = 'system';
  private listeners: ThemeListener[] = [];
  private mediaQuery: MediaQueryList | null = null;

  init() {
    const stored = localStorage.getItem('ai-studio-theme') as ThemeMode | null;
    this.mode = stored || 'system';

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => {
      if (this.mode === 'system') {
        this.applyTheme();
      }
    });

    this.applyTheme();
  }

  getMode(): ThemeMode {
    return this.mode;
  }

  getResolvedTheme(): 'light' | 'dark' {
    if (this.mode === 'system') {
      return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    return this.mode;
  }

  setMode(mode: ThemeMode) {
    this.mode = mode;
    localStorage.setItem('ai-studio-theme', mode);
    this.applyTheme();
    this.notifyListeners();
  }

  subscribe(listener: ThemeListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private applyTheme() {
    const resolved = this.getResolvedTheme();
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  }

  private notifyListeners() {
    const resolved = this.getResolvedTheme();
    this.listeners.forEach(l => l(resolved));
  }
}

export const themeManager = new ThemeManager();
