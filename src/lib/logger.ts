// Structured Logging System

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private storageKey = 'ai-studio-logs';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.logs = JSON.parse(stored);
      } catch {
        this.logs = [];
      }
    }
  }

  private saveToStorage(): void {
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
  }

  private log(level: LogLevel, event: string, message: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      data,
    };

    this.logs.push(entry);
    this.saveToStorage();

    // Also log to console
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(`[${level.toUpperCase()}] ${event}: ${message}`, data || '');
  }

  debug(event: string, message: string, data?: Record<string, any>): void {
    this.log('debug', event, message, data);
  }

  info(event: string, message: string, data?: Record<string, any>): void {
    this.log('info', event, message, data);
  }

  warn(event: string, message: string, data?: Record<string, any>): void {
    this.log('warn', event, message, data);
  }

  error(event: string, message: string, data?: Record<string, any>): void {
    this.log('error', event, message, data);
  }

  // Specific event loggers
  generationCreated(id: string, type: string): void {
    this.info('generation.created', `Generation created: ${type}`, { id, type });
  }

  generationStarted(id: string): void {
    this.info('generation.started', 'Generation started', { id });
  }

  generationCompleted(id: string): void {
    this.info('generation.completed', 'Generation completed', { id });
  }

  generationFailed(id: string, error: string): void {
    this.error('generation.failed', 'Generation failed', { id, error });
  }

  queueStarted(): void {
    this.info('queue.started', 'Queue worker started');
  }

  queueFailed(error: string): void {
    this.error('queue.failed', 'Queue worker failed', { error });
  }

  providerRequest(provider: string, model: string): void {
    this.info('provider.request', `Provider request: ${provider}/${model}`, { provider, model });
  }

  providerError(provider: string, error: string): void {
    this.error('provider.error', `Provider error: ${provider}`, { provider, error });
  }

  projectCreated(id: string, name: string): void {
    this.info('project.created', `Project created: ${name}`, { id, name });
  }

  projectImported(id: string, name: string): void {
    this.info('project.imported', `Project imported: ${name}`, { id, name });
  }

  projectExported(id: string, name: string): void {
    this.info('project.exported', `Project exported: ${name}`, { id, name });
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    this.saveToStorage();
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getStats(): { total: number; byLevel: Record<LogLevel, number>; byEvent: Record<string, number> } {
    const byLevel: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    const byEvent: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byEvent[log.event] = (byEvent[log.event] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      byEvent,
    };
  }
}

export const logger = new Logger();
