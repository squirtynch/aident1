import React from 'react';
import { EmptyState, Button } from '../components/ui';

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

export const HistoryPage: React.FC = () => (
  <div className="p-6 overflow-y-auto h-full">
    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">History</h2>
    <p className="text-sm text-[var(--text-secondary)] mb-6">View your generation history.</p>
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="No history yet"
      description="Generation history will be populated as you create content. This feature will be implemented in a later task."
    />
  </div>
);
