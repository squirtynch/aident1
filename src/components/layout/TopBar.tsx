import React from 'react';
import { IconButton, Tooltip } from '../ui';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, onToggleSidebar, onOpenCommandPalette, actions }) => {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-[var(--border-default)] bg-[var(--bg-app)] flex-shrink-0">
      <div className="flex items-center gap-3">
        <IconButton onClick={onToggleSidebar} size="sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </IconButton>
        <div>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <Tooltip content="Command Palette (Ctrl+K)">
          <IconButton onClick={onOpenCommandPalette} size="sm" variant="secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 3m0 0l-3 3m3-3h12M12 19.5h-3" />
            </svg>
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
};
