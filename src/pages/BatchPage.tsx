import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Badge, Dialog, Input, Select, Spinner } from '../components/ui';
import { batchService } from '../lib/creative-services';
import { generationQueue } from '../lib/ai';
import type { BatchJob } from '../lib/contracts';

export const BatchPage: React.FC = () => {
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
          name: (j.request as any).name || 'Batch Job',
          type: ((j.request as any).type || 'image_generation') as BatchJob['type'],
          items: (j.request as any).items || [],
          status: (j.status === 'COMPLETED' ? 'completed' : j.status === 'FAILED' ? 'failed' : 'processing') as BatchJob['status'],
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
        }));
      setBatches(batchJobs);
    });

    return unsubscribe;
  }, []);

  const handleCreate = () => {
    setConfirmDialog({
      items: formData.itemCount,
      generations: formData.itemCount,
    });
  };

  const handleConfirm = async () => {
    const items = Array.from({ length: formData.itemCount }, (_, i) => ({
      prompt: `Batch item ${i + 1}`,
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
    if (confirm('Are you sure you want to cancel this batch?')) {
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Batch Processing</h2>
          <p className="text-sm text-[var(--text-secondary)]">Process multiple items in bulk</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Batch
        </Button>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
          }
          title="No batches yet"
          description="Create a batch to process multiple items at once."
          action={<Button onClick={() => setCreateDialog(true)}>Create Batch</Button>}
        />
      ) : (
        <div className="space-y-4">
          {batches.map(batch => (
            <Card key={batch.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{batch.name}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {batch.items.length} items · Created {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={batch.status === 'completed' ? 'success' : batch.status === 'failed' ? 'danger' : 'warning'}>
                  {batch.status}
                </Badge>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                  <span>Progress</span>
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
                    Pause
                  </Button>
                )}
                {batch.status === 'pending' && (
                  <Button variant="secondary" size="sm" onClick={() => handleResume(batch.id)}>
                    Resume
                  </Button>
                )}
                {batch.status !== 'completed' && batch.status !== 'cancelled' && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(batch.id)}>
                    Cancel
                  </Button>
                )}
                {batch.items.some(i => i.status === 'failed') && (
                  <Button variant="secondary" size="sm" onClick={() => handleRetryFailed(batch.id)}>
                    Retry Failed
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
        title="Create Batch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim() || formData.itemCount < 1}>
              Continue
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Batch Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <Select
            label="Task Type"
            options={[
              { value: 'image_generation', label: 'Image Generation' },
              { value: 'try_on', label: 'Try-On' },
              { value: 'lifestyle', label: 'Lifestyle' },
              { value: 'advertising', label: 'Advertising' },
              { value: 'product_card', label: 'Product Card' },
            ]}
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as BatchJob['type'] })}
          />
          <Input
            label="Number of Items"
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
        title="Confirm Batch Generation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button onClick={handleConfirm}>Start Generation</Button>
          </>
        }
      >
        {confirmDialog && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              You are about to start a batch generation. Please review the details:
            </p>
            <div className="bg-[var(--bg-hover)] rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Items:</span>
                <span className="font-medium text-[var(--text-primary)]">{confirmDialog.items}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Estimated generations:</span>
                <span className="font-medium text-[var(--text-primary)]">{confirmDialog.generations}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              This will consume API credits. Make sure you have sufficient balance.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
};
