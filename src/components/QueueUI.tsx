// Queue UI - Display and manage the generation queue

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge, IconButton, EmptyState, Tooltip } from './ui';
import { generationQueue } from '../lib/ai';
import type { QueueJob, QueueJobStatus } from '../lib/contracts';

interface QueueUIProps {
  projectId?: string;
}

export const QueueUI: React.FC<QueueUIProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const unsubscribe = generationQueue.subscribe(updatedJobs => {
      if (projectId) {
        setJobs(updatedJobs.filter(j => (j.request as any).projectId === projectId));
      } else {
        setJobs(updatedJobs);
      }
    });

    setPaused(generationQueue.isPaused());

    return unsubscribe;
  }, [projectId]);

  const handlePause = () => {
    generationQueue.pause();
    setPaused(true);
  };

  const handleResume = () => {
    generationQueue.resume();
    setPaused(false);
  };

  const handleCancel = (id: string) => {
    generationQueue.cancelJob(id);
  };

  const handleRetry = (id: string) => {
    generationQueue.retryJob(id);
  };

  const handleRetryAll = () => {
    generationQueue.retryAllFailed();
  };

  const handleClearCompleted = () => {
    generationQueue.clearCompleted();
  };

  const getStatusBadge = (status: QueueJobStatus) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'primary'> = {
      CREATED: 'default',
      QUEUED: 'default',
      PREPARING: 'primary',
      PROCESSING: 'primary',
      DOWNLOADING: 'primary',
      FINALIZING: 'primary',
      COMPLETED: 'success',
      FAILED: 'danger',
      RETRYING: 'warning',
      CANCELLED: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{t(`status.${status.toLowerCase()}`)}</Badge>;
  };

  const activeJobs = jobs.filter(j => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
  const failedJobs = jobs.filter(j => j.status === 'FAILED');

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
        title={t('queue.queueEmpty')}
        description={t('queue.generatedContent')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {paused ? (
            <Button variant="secondary" size="sm" onClick={handleResume}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              {t('queue.resume')}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handlePause}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('queue.pause')}
            </Button>
          )}
          {failedJobs.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleRetryAll}>
              {t('queue.retryAllFailed')} ({failedJobs.length})
            </Button>
          )}
          {completedJobs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
              {t('queue.clearCompleted')}
            </Button>
          )}
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {activeJobs.length} {t('queue.active')} · {completedJobs.length} {t('queue.completed')} · {failedJobs.length} {t('queue.failed')}
        </div>
      </div>

      {/* Jobs list */}
      <div className="space-y-2">
        {jobs.map(job => (
          <Card key={job.id} className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(job.status)}
                  <span className="text-xs text-[var(--text-tertiary)]">{job.type}</span>
                  {job.retryCount > 0 && (
                    <span className="text-xs text-amber-600">{t('queue.retry')} {job.retryCount}/{job.maxRetries}</span>
                  )}
                </div>
                {job.error && (
                  <p className="text-xs text-red-500 mt-1">{job.error}</p>
                )}
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {t('queue.created')} {new Date(job.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {job.status === 'FAILED' && (
                  <Tooltip content={t('queue.retry')}>
                    <IconButton size="sm" onClick={() => handleRetry(job.id)}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </IconButton>
                  </Tooltip>
                )}
                {!['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status) && (
                  <Tooltip content={t('queue.cancel')}>
                    <IconButton size="sm" onClick={() => handleCancel(job.id)}>
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
