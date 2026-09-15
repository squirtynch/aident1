import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Select, Switch, Tabs, Input, Spinner, Badge } from '../components/ui';
import { getSettings, saveSettings, getStoragePaths, getAISettings, saveAISettings } from '../lib/storage';
import { themeManager } from '../lib/theme';
import { aiService, providerRegistry, credentialStore } from '../lib/ai';
import type { ThemeMode, ProviderConfig, AIModel } from '../lib/contracts';

// Models List Component
const ModelsList: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await aiService.listModels();
      if (response.success && response.data) {
        setModels(response.data);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Spinner size="sm" />
          Loading models...
        </div>
      </Card>
    );
  }

  if (models.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-[var(--text-secondary)]">
          No models available. Please configure your API key in the AI Provider section.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="space-y-3">
        {models.map(model => (
          <div key={model.id} className="border border-[var(--border-default)] rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-[var(--text-primary)]">{model.name}</h4>
                <p className="text-xs text-[var(--text-tertiary)] font-mono">{model.id}</p>
              </div>
              <Badge variant="primary">{model.provider}</Badge>
            </div>
            {model.description && (
              <p className="text-xs text-[var(--text-secondary)] mb-2">{model.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {model.capabilities.map(cap => (
                <Badge
                  key={cap.capability}
                  variant={cap.status === 'SUPPORTED' ? 'success' : cap.status === 'UNSUPPORTED' ? 'default' : 'warning'}
                >
                  {cap.capability}: {cap.status}
                </Badge>
              ))}
            </div>
            {model.contextWindow && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Context: {model.contextWindow.toLocaleString()} tokens
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

// AI Provider Settings Component
const AIProviderSettings: React.FC = () => {
  const [aiSettings, setAISettings] = useState<ProviderConfig>(getAISettings());
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    loadMaskedKey();
    loadModels();
  }, []);

  const loadMaskedKey = async () => {
    const masked = await credentialStore.getMaskedCredential('openrouter', 'api_key');
    setMaskedKey(masked);
  };

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const response = await aiService.listModels();
      if (response.success && response.data) {
        setModels(response.data);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    
    await aiService.setApiKey('openrouter', apiKey.trim());
    setApiKey('');
    await loadMaskedKey();
    setTestResult({ success: true, message: 'API key saved successfully' });
    
    // Reload models
    await loadModels();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await aiService.validateApiKey();
      if (result.valid) {
        setTestResult({ success: true, message: 'Connection successful! API key is valid.' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleModelChange = (field: keyof ProviderConfig, value: string) => {
    const updated = { ...aiSettings, [field]: value };
    setAISettings(updated);
    saveAISettings(updated);
  };

  const modelOptions = models.map(m => ({ value: m.id, label: m.name }));

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">AI Provider</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Configure your AI service provider and API credentials.</p>

      <div className="space-y-6">
        {/* Provider Selection */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Provider</h3>
          <Select
            label="AI Provider"
            options={[
              { value: 'openrouter', label: 'OpenRouter' },
              { value: 'mock', label: 'Mock (Development)' },
            ]}
            value={aiSettings.provider}
            onChange={e => handleModelChange('provider', e.target.value)}
          />
        </Card>

        {/* API Key */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">API Key</h3>
          
          {maskedKey && (
            <div className="mb-3">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Current key:</p>
              <p className="text-sm font-mono text-[var(--text-secondary)] bg-[var(--bg-hover)] px-3 py-2 rounded">
                {maskedKey}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Input
              type="password"
              label={maskedKey ? 'Update API Key' : 'Enter API Key'}
              placeholder="sk-or-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            
            <div className="flex gap-2">
              <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                Save Key
              </Button>
              <Button variant="secondary" onClick={handleTestConnection} disabled={testing}>
                {testing ? <Spinner size="sm" /> : 'Test Connection'}
              </Button>
            </div>

            {testResult && (
              <div className={`text-sm px-3 py-2 rounded ${testResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                {testResult.message}
              </div>
            )}

            <p className="text-xs text-[var(--text-tertiary)]">
              Your API key is stored securely and never exposed to the frontend or stored in project files.
            </p>
          </div>
        </Card>

        {/* Model Selection */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Models</h3>
          
          {loadingModels ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Spinner size="sm" />
              Loading models...
            </div>
          ) : models.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No models available. Please configure your API key first.
            </p>
          ) : (
            <div className="space-y-4">
              <Select
                label="Default Model"
                options={modelOptions}
                value={aiSettings.defaultModel || ''}
                onChange={e => handleModelChange('defaultModel', e.target.value)}
              />
              <Select
                label="Text Model"
                options={modelOptions}
                value={aiSettings.textModel || aiSettings.defaultModel || ''}
                onChange={e => handleModelChange('textModel', e.target.value)}
              />
              <Select
                label="Vision Model"
                options={models.filter(m => m.capabilities.some((c: any) => c.capability === 'VISION' && c.status === 'SUPPORTED')).map(m => ({ value: m.id, label: m.name }))}
                value={aiSettings.visionModel || ''}
                onChange={e => handleModelChange('visionModel', e.target.value)}
              />
              <Select
                label="Image Generation Model"
                options={models.filter(m => m.capabilities.some((c: any) => c.capability === 'IMAGE_GENERATION' && c.status === 'SUPPORTED')).map(m => ({ value: m.id, label: m.name }))}
                value={aiSettings.imageModel || ''}
                onChange={e => handleModelChange('imageModel', e.target.value)}
              />
              <Select
                label="Image Editing Model"
                options={models.filter(m => m.capabilities.some((c: any) => c.capability === 'IMAGE_EDITING' && c.status === 'SUPPORTED')).map(m => ({ value: m.id, label: m.name }))}
                value={aiSettings.imageEditModel || ''}
                onChange={e => handleModelChange('imageEditModel', e.target.value)}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState(getSettings());
  const [activeSection, setActiveSection] = useState('general');
  const storagePaths = getStoragePaths();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    const u = { ...settings, language };
    setSettings(u);
    saveSettings(u);
  };

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
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{t('settings.general')}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">{t('settings.configureGeneral')}</p>

            <Card className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{t('settings.autoSave')}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{t('settings.autoSaveDescription')}</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onChange={v => { const u = { ...settings, autoSave: v }; setSettings(u); saveSettings(u); }}
                />
              </div>
              <div className="border-t border-[var(--border-default)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{t('settings.language')}</p>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{t('settings.languageDescription')}</p>
                <Select
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'ru', label: 'Русский' }
                  ]}
                  value={i18n.language}
                  onChange={e => handleLanguageChange(e.target.value)}
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
          <AIProviderSettings />
        )}

        {activeSection === 'models' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Models</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">View available AI models and their capabilities.</p>
            <ModelsList />
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
