import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { commandRegistry } from '../../lib/commands';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = commandRegistry.getAll();

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.category?.toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    const cat = cmd.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {} as Record<string, typeof filtered>);

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-[var(--bg-overlay)]" />
      <div
        className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border-default)] overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
          <svg className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.typeCommand')}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
          <kbd className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
              {t('commandPalette.noCommandsFound')}
            </div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map(cmd => {
                  const idx = globalIndex++;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                        ${selectedIndex === idx ? 'bg-[var(--bg-hover)]' : ''}
                      `}
                    >
                      <span className="text-[var(--text-secondary)]">{cmd.label}</span>
                      {cmd.description && (
                        <span className="text-xs text-[var(--text-tertiary)] ml-auto">{cmd.description}</span>
                      )}
                      {cmd.shortcut && (
                        <kbd className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded ml-auto">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border-default)] text-xs text-[var(--text-tertiary)]">
          <span>↑↓ {t('commandPalette.navigate')}</span>
          <span>↵ {t('commandPalette.execute')}</span>
          <span>ESC {t('commandPalette.close')}</span>
        </div>
      </div>
    </div>
  );
};
