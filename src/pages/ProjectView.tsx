import React, { useState, useCallback, useRef } from 'react';
import { Card, Tabs, EmptyState, Button } from '../components/ui';
import { getProject, getAssets } from '../lib/storage';
import { importAsset, formatRelativeDate, formatFileSize } from '../lib/utils';
import type { Project, Asset } from '../lib/contracts';

interface ProjectViewProps {
  projectId: string;
  onBack: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onBack, onToast }) => {
  const [project, setProject] = useState<Project | undefined>(getProject(projectId));
  const [assets, setAssets] = useState<Asset[]>(getAssets(projectId));
  const [activeTab, setActiveTab] = useState('product');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setProject(getProject(projectId));
    setAssets(getAssets(projectId));
  }, [projectId]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsImporting(true);
    let imported = 0;
    let errors = 0;

    for (const file of Array.from(files)) {
      try {
        await importAsset(file, projectId);
        imported++;
      } catch {
        errors++;
      }
    }

    refresh();
    setIsImporting(false);

    if (imported > 0) {
      onToast(`${imported} image${imported > 1 ? 's' : ''} imported`, 'success');
    }
    if (errors > 0) {
      onToast(`${errors} file${errors > 1 ? 's' : ''} failed to import`, 'error');
    }
  }, [projectId, refresh, onToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState title="Project not found" description="This project may have been deleted." action={<Button onClick={onBack}>Back to Projects</Button>} />
      </div>
    );
  }

  const tabs = [
    { id: 'product', label: 'Product', count: assets.length },
    { id: 'generations', label: 'Generations' },
    { id: 'references', label: 'References' },
    { id: 'text', label: 'Text' },
    { id: 'cards', label: 'Cards' },
    { id: 'video', label: 'Video' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="px-6 py-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{project.name}</h2>
          {project.favorite && (
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )}
        </div>
        {project.description && <p className="text-sm text-[var(--text-secondary)] ml-8">{project.description}</p>}
        <p className="text-xs text-[var(--text-tertiary)] ml-8 mt-1">Created {formatRelativeDate(project.createdAt)}</p>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'product' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative min-h-full transition-colors ${isDragging ? 'bg-primary-50 dark:bg-primary-900/10 rounded-xl border-2 border-dashed border-primary-400' : ''}`}
          >
            {assets.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                }
                title="No product images"
                description="Drag and drop images here, or click the button below to import. Supported: PNG, JPG, JPEG, WebP"
                action={
                  <div className="flex gap-2">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Import Images
                    </Button>
                  </div>
                }
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[var(--text-secondary)]">{assets.length} image{assets.length !== 1 ? 's' : ''}</p>
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add More
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {assets.map(asset => (
                    <Card key={asset.id} hoverable className="overflow-hidden group">
                      <div className="aspect-square bg-[var(--bg-hover)]">
                        <img src={asset.thumbnailPath} alt={asset.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{asset.name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{formatFileSize(asset.sizeBytes)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary-50/80 dark:bg-primary-900/20 rounded-xl z-10">
                <div className="text-center">
                  <svg className="w-12 h-12 text-primary-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-primary-600 font-medium">Drop to import</p>
                </div>
              </div>
            )}

            {isImporting && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] rounded-xl z-20">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin-slow mx-auto mb-2" />
                  <p className="text-white text-sm">Importing...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generations' && (
          <EmptyState
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
            title="No generations yet"
            description="Product Card generation will be implemented in a later task."
          />
        )}

        {activeTab === 'references' && (
          <EmptyState
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>}
            title="No references"
            description="Reference image management will be implemented in a later task."
          />
        )}

        {activeTab === 'text' && (
          <EmptyState
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
            title="No text content"
            description="AI text generation will be implemented in a later task."
          />
        )}

        {activeTab === 'cards' && (
          <EmptyState
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" /></svg>}
            title="No product cards"
            description="Product Card generation will be implemented in a later task."
          />
        )}

        {activeTab === 'video' && (
          <EmptyState
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>}
            title="No video content"
            description="Video generation will be implemented in a later task."
          />
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple className="hidden" onChange={handleFileInput} />
    </div>
  );
};
