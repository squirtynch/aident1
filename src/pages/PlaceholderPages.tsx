import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export const CreatePage: React.FC<{ onNavigate: (page: 'projects') => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{t('navigation.create')}</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">{t('create.subtitle')}</p>
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        }
        title={t('create.comingSoon')}
        description={t('create.description')}
        action={<Button onClick={() => onNavigate('projects')}>{t('create.goToProjects')}</Button>}
      />
    </div>
  );
};

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('navigation.history')}</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('history.generationCount', { count: filtered.length })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder={t('history.searchPlaceholder')}
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
              {t(`history.${f}`)}
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
          title={t('history.noGenerationsYet')}
          description={t('history.historyDescription')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(gen => (
            <div key={gen.id} className="border border-[var(--border-default)] rounded-lg p-4 bg-[var(--bg-card)]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={gen.status === 'completed' ? 'success' : gen.status === 'failed' ? 'danger' : 'warning'}>
                      {t(`status.${gen.status}`)}
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
