import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { DragDropOverlay } from './components/layout/DragDropOverlay';
import { Toast } from './components/ui';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectView } from './pages/ProjectView';
import { Settings } from './pages/Settings';
import { CreatePage, HistoryPage } from './pages/PlaceholderPages';
import { LibraryPage } from './pages/LibraryPage';
import { BatchPage } from './pages/BatchPage';
import { TestRunnerPage } from './pages/TestRunner';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { CreateProjectDialog } from './components/CreateProjectDialog';
import { themeManager } from './lib/theme';
import { commandRegistry } from './lib/commands';
import type { PageId, Project } from './lib/contracts';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: number;
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize theme
  useEffect(() => {
    themeManager.init();
  }, []);

  // Register commands
  useEffect(() => {
    commandRegistry.register({
      id: 'new-project',
      label: 'New Project',
      description: 'Create a new project',
      category: 'Projects',
      action: () => setCreateProjectOpen(true),
    });

    commandRegistry.register({
      id: 'open-projects',
      label: 'Open Projects',
      description: 'View all projects',
      category: 'Navigation',
      action: () => { setCurrentPage('projects'); setSelectedProjectId(null); },
    });

    commandRegistry.register({
      id: 'open-library',
      label: 'Open Library',
      description: 'View asset library',
      category: 'Navigation',
      action: () => setCurrentPage('library'),
    });

    commandRegistry.register({
      id: 'open-batch',
      label: 'Open Batch',
      description: 'Batch processing',
      category: 'Navigation',
      action: () => setCurrentPage('batch'),
    });

    commandRegistry.register({
      id: 'open-history',
      label: 'Open History',
      description: 'View generation history',
      category: 'Navigation',
      action: () => setCurrentPage('history'),
    });

    commandRegistry.register({
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Application settings',
      category: 'Navigation',
      action: () => setCurrentPage('settings'),
    });

    commandRegistry.register({
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light/dark/system',
      category: 'Appearance',
      action: () => {
        const current = themeManager.getMode();
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
        themeManager.setMode(next);
      },
    });

    commandRegistry.register({
      id: 'open-dashboard',
      label: 'Open Dashboard',
      description: 'Go to dashboard',
      category: 'Navigation',
      action: () => { setCurrentPage('dashboard'); setSelectedProjectId(null); },
    });

    commandRegistry.register({
      id: 'run-tests',
      label: 'Run AI Engine Tests',
      description: 'Execute the test suite',
      category: 'Development',
      action: () => { setCurrentPage('history'); /* Using history page slot for tests */ },
    });

    commandRegistry.register({
      id: 'open-diagnostics',
      label: 'Open Diagnostics',
      description: 'Run system diagnostics',
      category: 'Development',
      action: () => { setCurrentPage('diagnostics'); setSelectedProjectId(null); },
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global drag/drop detection
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleNavigate = useCallback((page: PageId) => {
    setCurrentPage(page);
    if (page !== 'projects') {
      setSelectedProjectId(null);
    }
  }, []);

  const handleOpenProject = useCallback((id: string) => {
    setSelectedProjectId(id);
  }, []);

  const handleProjectCreated = useCallback((project: Project) => {
    setCreateProjectOpen(false);
    setSelectedProjectId(project.id);
    setCurrentPage('projects');
    setRefreshKey(k => k + 1);
    showToast(`Project "${project.name}" created`, 'success');
  }, [showToast]);

  // Page titles
  const getPageTitle = () => {
    if (selectedProjectId) return 'Project';
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'create': return 'Create';
      case 'projects': return 'Projects';
      case 'library': return 'Library';
      case 'batch': return 'Batch';
      case 'history': return 'History';
      case 'settings': return 'Settings';
      case 'diagnostics': return 'Diagnostics';
      default: return 'AI Product Studio';
    }
  };

  const renderPage = () => {
    if (selectedProjectId) {
      return (
        <ProjectView
          key={selectedProjectId}
          projectId={selectedProjectId}
          onBack={() => setSelectedProjectId(null)}
          onToast={showToast}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'create':
        return <CreatePage onNavigate={handleNavigate} />;
      case 'projects':
        return (
          <Projects
            key={refreshKey}
            onOpenProject={handleOpenProject}
            onCreateProject={() => setCreateProjectOpen(true)}
          />
        );
      case 'library':
        return <LibraryPage />;
      case 'batch':
        return <BatchPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <Settings />;
      case 'diagnostics':
        return <DiagnosticsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <TopBar
          title={getPageTitle()}
          subtitle={selectedProjectId ? undefined : undefined}
          onToggleSidebar={() => setSidebarCollapsed(c => !c)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-[var(--bg-app)]">
          {renderPage()}
        </main>
      </div>

      {/* Overlays */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <CreateProjectDialog
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={handleProjectCreated}
      />

      <DragDropOverlay active={isDragging} />

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
