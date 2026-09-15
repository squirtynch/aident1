import React, { useState } from 'react';
import { Card, Button, Select, Switch, Tabs } from '../components/ui';
import { getSettings, saveSettings, getStoragePaths } from '../lib/storage';
import { themeManager } from '../lib/theme';
import type { ThemeMode } from '../lib/contracts';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState(getSettings());
  const [activeSection, setActiveSection] = useState('general');
  const storagePaths = getStoragePaths();

  const handleThemeChange = (mode: ThemeMode) => {
    themeManager.setMode(mode);
    const updated = { ...settings, theme: mode };
    setSettings(updated);
    saveSettings(updated);
  };

  const sections = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'storage', label: 'Storage' },
    { id: 'ai-provider', label: 'AI Provider' },
    { id: 'models', label: 'Models' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="flex h-full">
      {/* Settings sidebar */}
      <div className="w-56 border-r border-[var(--border-default)] py-4 px-2 flex-shrink-0">
        <nav className="space-y-0.5">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeSection === section.id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'general' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">General</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Configure general application settings.</p>

            <Card className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Auto-save</p>
                  <p className="text-xs text-[var(--text-secondary)]">Automatically save changes to projects</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onChange={v => { const u = { ...settings, autoSave: v }; setSettings(u); saveSettings(u); }}
                />
              </div>
              <div className="border-t border-[var(--border-default)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Language</p>
                <p className="text-xs text-[var(--text-secondary)] mb-2">Application display language</p>
                <Select
                  options={[{ value: 'en', label: 'English' }]}
                  value={settings.language}
                  onChange={e => { const u = { ...settings, language: e.target.value }; setSettings(u); saveSettings(u); }}
                />
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Appearance</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Customize the look and feel of the application.</p>

            <Card className="p-5">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleThemeChange(mode)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${settings.theme === mode
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                      }
                    `}
                  >
                    {mode === 'light' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    )}
                    {mode === 'dark' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    )}
                    {mode === 'system' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{mode}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'storage' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Storage</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">View and manage application storage locations.</p>

            <Card className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Root Directory</p>
                <p className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--bg-hover)] px-3 py-2 rounded-lg">{storagePaths.root}</p>
              </div>
              <div className="border-t border-[var(--border-default)]" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">Subdirectories</p>
                {[
                  { name: 'Database', path: storagePaths.database },
                  { name: 'Projects', path: storagePaths.projects },
                  { name: 'Library', path: storagePaths.library },
                  { name: 'Cache', path: storagePaths.cache },
                  { name: 'Exports', path: storagePaths.exports },
                  { name: 'Logs', path: storagePaths.logs },
                ].map(dir => (
                  <div key={dir.name} className="flex items-center justify-between py-1">
                    <span className="text-sm text-[var(--text-secondary)]">{dir.name}</span>
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{dir.path}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border-default)]" />
              <p className="text-xs text-[var(--text-tertiary)]">
                In production, these directories are created automatically on first launch.
                Data is stored locally and never sent to external servers.
              </p>
            </Card>
          </div>
        )}

        {activeSection === 'ai-provider' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">AI Provider</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Configure AI service providers.</p>
            <Card className="p-5">
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <p className="text-sm text-[var(--text-secondary)]">AI provider configuration will be implemented in Task 2.</p>
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'models' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Models</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Manage AI model configurations.</p>
            <Card className="p-5">
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-secondary)]">Model configuration will be implemented in Task 2.</p>
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Notifications</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Configure notification preferences.</p>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Enable notifications</p>
                  <p className="text-xs text-[var(--text-secondary)]">Show notifications for completed tasks</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onChange={v => { const u = { ...settings, notifications: v }; setSettings(u); saveSettings(u); }}
                />
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'diagnostics' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Diagnostics</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Application diagnostics and system information.</p>
            <Card className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Version</span>
                <span className="text-sm text-[var(--text-primary)] font-mono">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Platform</span>
                <span className="text-sm text-[var(--text-primary)] font-mono">Web (Tauri in production)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Python Core</span>
                <span className="text-sm text-[var(--text-primary)] font-mono">Pending integration</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Database</span>
                <span className="text-sm text-[var(--text-primary)] font-mono">SQLite (pending)</span>
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'advanced' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Advanced</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Advanced configuration options.</p>
            <Card className="p-5">
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-secondary)]">Advanced settings will be available in future tasks.</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
