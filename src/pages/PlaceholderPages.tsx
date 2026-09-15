import React, { useState, useEffect } from 'react';
import { EmptyState, Button, Badge } from '../components/ui';
import { getGenerations } from '../lib/storage';
import type { Generation } from '../lib/contracts';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon }) => {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
      />
    </div>
  );
};

export const CreatePage: React.FC<{ onNavigate: (page: 'projects') => void }> = ({ onNavigate }) => (
  <div className="p-6 overflow-y-auto h-full">
    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create</h2>
    <p className="text-sm text-[var(--text-secondary)] mb-6">Start a new project or generation.</p>
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      }
      title="Creation tools coming soon"
      description="AI-powered product content creation will be implemented in Task 2. For now, you can create projects from the Projects page."
      action={<Button onClick={() => onNavigate('projects')}>Go to Projects</Button>}
    />
  </div>
);

export const LibraryPage: React.FC = () => (
  <div className="p-6 overflow-y-auto h-full">
    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Library</h2>
    <p className="text-sm text-[var(--text-secondary)] mb-6">Your shared asset library.</p>
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      }
      title="Library is empty"
      description="Library management will be implemented in a later task. Import images into projects to get started."
    />
  </div>
);

export const BatchPage: React.FC = () => (
  <div className="p-6 overflow-y-auto h-full">
    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Batch</h2>
    <p className="text-sm text-[var(--text-secondary)] mb-6">Batch generation and processing.</p>
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
        </svg>
      }
      title="Batch processing coming soon"
      description="Batch generation will be implemented in a later task."
    />
  </div>
);

export const HistoryPage: React.FC = () => {
  const [generations, setGenerations] = useState<import('../lib/contracts').Generation[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'processing'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setGenerations(getGenerations());
  }, []);

  const filtered = generations.filter(g => {
    if (filter === 'completed' && g.status !== 'completed') return false;
    if (filter === 'failed' && g.status !== 'failed') return false;
    if (filter === 'processing' && !['queued', 'preparing', 'processing', 'downloading', 'finalizing'].includes(g.status)) return false;
    if (search && !g.prompt?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">History</h2>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} generation{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 text-sm rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-primary-500"
        />
        <div className="flex gap-1 bg-[var(--bg-hover)] rounded-lg p-0.5">
          {(['all', 'completed', 'processing', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize
                ${filter === f ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No generations yet"
          description="Your generation history will appear here as you create content."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(gen => (
            <div key={gen.id} className="border border-[var(--border-default)] rounded-lg p-4 bg-[var(--bg-card)]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={gen.status === 'completed' ? 'success' : gen.status === 'failed' ? 'danger' : 'warning'}>
                      {gen.status}
                    </Badge>
                    <span className="text-xs text-[var(--text-tertiary)]">{gen.type}</span>
                  </div>
                  {gen.prompt && (
                    <p className="text-sm text-[var(--text-primary)] line-clamp-2">{gen.prompt}</p>
                  )}
                  {gen.error && (
                    <p className="text-xs text-red-500 mt-1">{gen.error}</p>
                  )}
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {new Date(gen.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
