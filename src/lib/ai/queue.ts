// Generation Queue - Persistent job queue with retry logic

import type { QueueJob, QueueJobStatus } from '../contracts';
import { v4 as uuidv4 } from 'uuid';

const QUEUE_STORAGE_KEY = 'ai-studio-queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff

type QueueListener = (jobs: QueueJob[]) => void;

class GenerationQueue {
  private jobs: QueueJob[] = [];
  private listeners: QueueListener[] = [];
  private processing = false;
  private paused = false;
  private workerInterval: number | null = null;

  constructor() {
    this.loadFromStorage();
    this.startWorker();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        this.jobs = JSON.parse(stored);
      } catch {
        this.jobs = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.jobs));
  }

  private notify(): void {
    this.listeners.forEach(l => l([...this.jobs]));
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getJobs(): QueueJob[] {
    return [...this.jobs];
  }

  getJob(id: string): QueueJob | undefined {
    return this.jobs.find(j => j.id === id);
  }

  getJobsByStatus(status: QueueJobStatus): QueueJob[] {
    return this.jobs.filter(j => j.status === status);
  }

  getJobsByProject(projectId: string): QueueJob[] {
    return this.jobs.filter(j => {
      const req = j.request as any;
      return req.projectId === projectId;
    });
  }

  addJob(type: QueueJob['type'], request: any): QueueJob {
    const job: QueueJob = {
      id: uuidv4(),
      type,
      status: 'CREATED',
      request,
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jobs.unshift(job);
    this.saveToStorage();
    this.notify();

    // Auto-queue
    this.updateJobStatus(job.id, 'QUEUED');

    return job;
  }

  updateJobStatus(id: string, status: QueueJobStatus, error?: string): void {
    const job = this.jobs.find(j => j.id === id);
    if (!job) return;

    job.status = status;
    job.updatedAt = new Date().toISOString();
    
    if (error) {
      job.error = error;
    }

    if (status === 'PROCESSING' || status === 'PREPARING' || status === 'DOWNLOADING') {
      job.startedAt = new Date().toISOString();
    }

    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      job.completedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.notify();
  }

  setJobResult(id: string, result: any): void {
    const job = this.jobs.find(j => j.id === id);
    if (!job) return;

    job.result = result;
    job.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notify();
  }

  cancelJob(id: string): void {
    this.updateJobStatus(id, 'CANCELLED');
  }

  retryJob(id: string): void {
    const job = this.jobs.find(j => j.id === id);
    if (!job) return;

    job.retryCount = 0;
    job.error = undefined;
    job.result = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;

    this.updateJobStatus(id, 'QUEUED');
  }

  retryAllFailed(): void {
    const failed = this.getJobsByStatus('FAILED');
    failed.forEach(job => this.retryJob(job.id));
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  clearCompleted(): void {
    this.jobs = this.jobs.filter(j => j.status !== 'COMPLETED');
    this.saveToStorage();
    this.notify();
  }

  clearAll(): void {
    this.jobs = [];
    this.saveToStorage();
    this.notify();
  }

  private startWorker(): void {
    // Process queue every 500ms
    this.workerInterval = window.setInterval(() => {
      this.processNext();
    }, 500);
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.paused) return;

    const nextJob = this.jobs.find(j => j.status === 'QUEUED');
    if (!nextJob) return;

    this.processing = true;

    try {
      this.updateJobStatus(nextJob.id, 'PREPARING');

      // Simulate processing (in production, this would call the AI service)
      await new Promise(resolve => setTimeout(resolve, 100));

      this.updateJobStatus(nextJob.id, 'PROCESSING');

      // The actual processing is handled by the queue manager
      // which calls the appropriate AI service method

    } catch (error) {
      this.handleError(nextJob.id, error);
    } finally {
      this.processing = false;
    }
  }

  private async handleError(jobId: string, error: unknown): Promise<void> {
    const job = this.getJob(jobId);
    if (!job) return;

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRetryable = this.isRetryableError(error);

    if (isRetryable && job.retryCount < job.maxRetries) {
      job.retryCount++;
      const delay = RETRY_DELAYS[Math.min(job.retryCount - 1, RETRY_DELAYS.length - 1)];
      
      this.updateJobStatus(jobId, 'RETRYING', errorMessage);

      // Schedule retry
      setTimeout(() => {
        this.updateJobStatus(jobId, 'QUEUED');
      }, delay);
    } else {
      this.updateJobStatus(jobId, 'FAILED', errorMessage);
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('429')
      );
    }
    return false;
  }

  destroy(): void {
    if (this.workerInterval !== null) {
      clearInterval(this.workerInterval);
    }
  }
}

export const generationQueue = new GenerationQueue();
