import React, { useState, useMemo } from 'react';
import { Card, Button, Input, EmptyState, Dialog, IconButton, Badge } from '../components/ui';
import { getProjects, deleteProject } from '../lib/storage';
import { createNewProject, renameProject, duplicateProject, toggleFavorite, archiveProject, unarchiveProject } from '../lib/utils';
import { formatRelativeDate } from '../lib/utils';
import type { Project } from '../lib/contracts';

interface ProjectsProps {
  onOpenProject: (id: string) => void;
  onCreateProject: () => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onOpenProject, onCreateProject }) => {
  const [projects, setProjects] = useState<Project[]>(getProjects());
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [renameDialog, setRenameDialog] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const refresh = () => setProjects(getProjects());

  const filtered = useMemo(() => {
    let result = [...projects];

    // Filter
    if (filter === 'favorites') result = result.filter(p => p.favorite && !p.archived);
    else if (filter === 'archived') result = result.filter(p => p.archived);
    else result = result.filter(p => !p.archived);

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [projects, search, sortBy, filter]);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeleteDialog(null);
    refresh();
  };

  const handleRename = () => {
    if (renameDialog && renameValue.trim()) {
      renameProject(renameDialog.id, renameValue.trim());
      setRenameDialog(null);
      setRenameValue('');
      refresh();
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateProject(id);
    refresh();
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    refresh();
  };

  const handleArchive = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project?.archived) {
      unarchiveProject(id);
    } else {
      archiveProject(id);
    }
    refresh();
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Projects</h2>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={onCreateProject}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-[var(--bg-hover)] rounded-lg p-0.5">
          {(['all', 'favorites', 'archived'] as const).map(f => (
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
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none"
        >
          <option value="updated">Last Updated</option>
          <option value="created">Date Created</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
          title={search ? 'No matching projects' : 'No projects yet'}
          description={search ? 'Try a different search term.' : 'Create your first project to start generating AI product content.'}
          action={!search && <Button onClick={onCreateProject}>Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(project => (
            <Card key={project.id} hoverable className="group relative overflow-hidden">
              {/* Thumbnail */}
              <div className="aspect-video bg-[var(--bg-hover)] relative">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                )}
                {project.archived && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="warning">Archived</Badge>
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    size="sm"
                    variant="secondary"
                    onClick={e => { e.stopPropagation(); handleToggleFavorite(project.id); }}
                    className="bg-white/90 dark:bg-surface-800/90"
                  >
                    <svg className={`w-3.5 h-3.5 ${project.favorite ? 'text-amber-500 fill-amber-500' : ''}`} fill={project.favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </IconButton>
                </div>
              </div>

              {/* Info */}
              <div className="p-3" onClick={() => onOpenProject(project.id)}>
                <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{project.name}</h4>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{formatRelativeDate(project.updatedAt)}</p>
              </div>

              {/* Context menu */}
              <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconButton size="sm" onClick={e => { e.stopPropagation(); setRenameDialog(project); setRenameValue(project.name); }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </IconButton>
                <IconButton size="sm" onClick={e => { e.stopPropagation(); handleDuplicate(project.id); }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.375h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                </IconButton>
                <IconButton size="sm" onClick={e => { e.stopPropagation(); handleArchive(project.id); }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </IconButton>
                <IconButton size="sm" onClick={e => { e.stopPropagation(); setDeleteDialog(project.id); }}>
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        title="Delete Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete this project? This action cannot be undone.
        </p>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!renameDialog}
        onClose={() => setRenameDialog(null)}
        title="Rename Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameDialog(null)}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </>
        }
      >
        <Input
          label="Project name"
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRename()}
          autoFocus
        />
      </Dialog>
    </div>
  );
};
