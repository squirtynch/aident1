import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, EmptyState, Badge, Dialog, Input, Select, Spinner } from '../components/ui';
import { batchService } from '../lib/creative-services';
import { generationQueue } from '../lib/ai';
import type { BatchJob } from '../lib/contracts';

export const BatchPage: React.FC = () => {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<BatchJob[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ items: number; generations: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'image_generation' as BatchJob['type'],
    itemCount: 1,
  });

  useEffect(() => {
    const unsubscribe = generationQueue.subscribe(() => {
      // Refresh batches from queue
      const jobs = generationQueue.getJobs();
      const batchJobs: BatchJob[] = jobs
        .filter(j => j.type === 'image_generation' && (j.request as any)?.items)
        .map(j => ({
          id: j.id,
          name: (j.request as any).name || t('batch.defaultBatchName'),
          type: ((j.request as any).type || 'image_generation') as BatchJob['type'],
          items: (j.request as any).items || [],
          status: (j.status === 'COMPLETED' ? 'completed' : j.status === 'FAILED' ? 'failed' : 'processing') as BatchJob['status'],
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
        }));
      setBatches(batchJobs);
    });

    return unsubscribe;
  }, [t]);

  const handleCreate = () => {
    setConfirmDialog({
      items: formData.itemCount,
      generations: formData.itemCount,
    });
  };

  const handleConfirm = async () => {
    const items = Array.from({ length: formData.itemCount }, (_, i) => ({
      prompt: `${t('batch.batchItem')} ${i + 1}`,
    }));

    await batchService.createBatch(formData.name, formData.type, items);
    setCreateDialog(false);
    setConfirmDialog(null);
    setFormData({ name: '', type: 'image_generation', itemCount: 1 });
  };

  const handlePause = (batchId: string) => {
    batchService.pauseBatch(batchId);
  };

  const handleResume = (batchId: string) => {
    batchService.resumeBatch(batchId);
  };

  const handleCancel = (batchId: string) => {
    if (confirm(t('batch.cancelConfirm'))) {
      batchService.cancelBatch(batchId);
    }
  };

  const handleRetryFailed = (batchId: string) => {
    batchService.retryFailed(batchId);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('batch.title')}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{t('batch.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('batch.newBatch')}
        </Button>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
          }
          title={t('batch.noBatchesYet')}
          description={t('batch.createBatchDescription')}
          action={<Button onClick={() => setCreateDialog(true)}>{t('batch.createBatch')}</Button>}
        />
      ) : (
        <div className="space-y-4">
          {batches.map(batch => (
            <Card key={batch.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{batch.name}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {t('batch.itemsCount', { count: batch.items.length })} · {t('batch.created')} {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={batch.status === 'completed' ? 'success' : batch.status === 'failed' ? 'danger' : 'warning'}>
                  {t(`status.${batch.status}`)}
                </Badge>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                  <span>{t('batch.progress')}</span>
                  <span>
                    {batch.items.filter(i => i.status === 'completed').length} / {batch.items.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{
                      width: `${(batch.items.filter(i => i.status === 'completed').length / batch.items.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {batch.status === 'processing' && (
                  <Button variant="secondary" size="sm" onClick={() => handlePause(batch.id)}>
                    {t('batch.pause')}
                  </Button>
                )}
                {batch.status === 'pending' && (
                  <Button variant="secondary" size="sm" onClick={() => handleResume(batch.id)}>
                    {t('batch.resume')}
                  </Button>
                )}
                {batch.status !== 'completed' && batch.status !== 'cancelled' && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(batch.id)}>
                    {t('batch.cancelBatch')}
                  </Button>
                )}
                {batch.items.some(i => i.status === 'failed') && (
                  <Button variant="secondary" size="sm" onClick={() => handleRetryFailed(batch.id)}>
                    {t('batch.retryFailed')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        title={t('batch.createBatch')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim() || formData.itemCount < 1}>
              {t('batch.continue')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('batch.batchName')}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <Select
            label={t('batch.taskType')}
            options={[
              { value: 'image_generation', label: t('batch.imageGeneration') },
              { value: 'try_on', label: t('batch.tryOn') },
              { value: 'lifestyle', label: t('batch.lifestyle') },
              { value: 'advertising', label: t('batch.advertising') },
              { value: 'product_card', label: t('batch.productCard') },
            ]}
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as BatchJob['type'] })}
          />
          <Input
            label={t('batch.numberOfItems')}
            type="number"
            min="1"
            value={formData.itemCount.toString()}
            onChange={e => setFormData({ ...formData, itemCount: parseInt(e.target.value) || 1 })}
          />
        </div>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        title={t('batch.confirmBatchGeneration')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDialog(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleConfirm}>{t('batch.startGeneration')}</Button>
          </>
        }
      >
        {confirmDialog && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {t('batch.aboutToStart')}
            </p>
            <div className="bg-[var(--bg-hover)] rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{t('batch.items')}</span>
                <span className="font-medium text-[var(--text-primary)]">{confirmDialog.items}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{t('batch.estimatedGenerations')}</span>
                <span className="font-medium text-[var(--text-primary)]">{confirmDialog.generations}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {t('batch.consumeCredits')}
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
};
