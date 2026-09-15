import React, { useState, useCallback, useRef } from 'react';
import { Card, Tabs, EmptyState, Button, Badge, Input, Textarea, Dialog, Select, Spinner } from '../components/ui';
import { getProject, getAssets, getGenerations, addGeneration, updateGeneration, addGenerationVersion, getGenerationVersions, getAISettings, saveAITextResult } from '../lib/storage';
import { importAsset, formatRelativeDate, formatFileSize } from '../lib/utils';
import { aiService, generationQueue } from '../lib/ai';
import { ResultViewer } from '../components/ResultViewer';
import { QueueUI } from '../components/QueueUI';
import { projectExportService } from '../lib/project-io';
import type { Project, Asset, Generation, GenerationVersion, ProductAnalysis, AITextType, AITextResult } from '../lib/contracts';

interface ProjectViewProps {
  projectId: string;
  onBack: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onBack, onToast }) => {
  const [project, setProject] = useState<Project | undefined>(getProject(projectId));
  const [assets, setAssets] = useState<Asset[]>(getAssets(projectId));
  const [generations, setGenerations] = useState<Generation[]>(getGenerations(projectId));
  const [activeTab, setActiveTab] = useState('product');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI States
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Improve
  const [improving, setImproving] = useState(false);
  const [improveInstruction, setImproveInstruction] = useState('');
  const [showImproveDialog, setShowImproveDialog] = useState(false);

  // AI Text
  const [textType, setTextType] = useState<AITextType>('SHORT_DESCRIPTION');
  const [textResult, setTextResult] = useState<string>('');
  const [generatingText, setGeneratingText] = useState(false);

  // Product Photo
  const [photoGoal, setPhotoGoal] = useState('');
  const [photoStyle, setPhotoStyle] = useState('Professional product photography');
  const [photoBackground, setPhotoBackground] = useState('Clean white');
  const [photoAspectRatio, setPhotoAspectRatio] = useState('1:1');

  // Export
  const handleExportProject = async () => {
    try {
      await projectExportService.downloadProject(projectId);
      onToast('Project exported successfully', 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Export failed', 'error');
    }
  };

  const refresh = useCallback(() => {
    setProject(getProject(projectId));
    setAssets(getAssets(projectId));
    setGenerations(getGenerations(projectId));
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

  // Product Analysis
  const handleAnalyzeProduct = async (asset: Asset) => {
    setAnalyzing(true);
    setSelectedAsset(asset);
    try {
      const result = await aiService.analyzeProduct(asset.originalPath);
      setAnalysis(result);
      onToast('Product analyzed successfully', 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate Product Photo
  const handleGeneratePhoto = async () => {
    if (!selectedAsset) {
      onToast('Please select a product image first', 'error');
      return;
    }
    if (!photoGoal.trim()) {
      onToast('Please describe what you want to generate', 'error');
      return;
    }

    setGenerating(true);
    try {
      const aiSettings = getAISettings();
      const images = await aiService.generateProductPhoto({
        projectId,
        productAssetId: selectedAsset.id,
        goal: photoGoal,
        style: photoStyle,
        background: photoBackground,
        aspectRatio: photoAspectRatio,
        model: aiSettings.imageModel,
      });

      setGeneratedImages(images);
      setShowViewer(true);
      setViewerIndex(0);

      // Save generation
      const generation: Generation = {
        id: crypto.randomUUID(),
        projectId,
        type: 'product_photo',
        status: 'completed',
        prompt: photoGoal,
        model: aiSettings.imageModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addGeneration(generation);

      // Save version
      const version: GenerationVersion = {
        id: crypto.randomUUID(),
        generationId: generation.id,
        version: 1,
        imagePath: images[0],
        thumbnailPath: images[0],
        prompt: photoGoal,
        parameters: { style: photoStyle, background: photoBackground, aspectRatio: photoAspectRatio },
        createdAt: new Date().toISOString(),
      };
      addGenerationVersion(version);

      refresh();
      onToast('Image generated successfully', 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Improve Image
  const handleImprove = async () => {
    if (!selectedAsset || !improveInstruction.trim()) return;

    setImproving(true);
    try {
      const aiSettings = getAISettings();
      const result = await aiService.improveImage({
        projectId,
        sourceAssetId: selectedAsset.originalPath,
        instruction: improveInstruction,
        model: aiSettings.imageEditModel,
      });

      setGeneratedImages([result]);
      setShowViewer(true);
      setViewerIndex(0);
      setShowImproveDialog(false);
      setImproveInstruction('');

      // Save generation
      const generation: Generation = {
        id: crypto.randomUUID(),
        projectId,
        type: 'improve',
        status: 'completed',
        prompt: improveInstruction,
        model: aiSettings.imageEditModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addGeneration(generation);

      refresh();
      onToast('Image improved successfully', 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Improve failed', 'error');
    } finally {
      setImproving(false);
    }
  };

  // AI Text
  const handleGenerateText = async () => {
    setGeneratingText(true);
    try {
      const aiSettings = getAISettings();
      const result = await aiService.generateAIText({
        type: textType,
        product: analysis || undefined,
        model: aiSettings.textModel,
      });

      setTextResult(result.text);
      saveAITextResult(result);

      // Save generation
      const generation: Generation = {
        id: crypto.randomUUID(),
        projectId,
        type: 'ai_text',
        status: 'completed',
        prompt: `Generate ${textType}`,
        model: aiSettings.textModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addGeneration(generation);
      refresh();

      onToast('Text generated successfully', 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Text generation failed', 'error');
    } finally {
      setGeneratingText(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(textResult);
    onToast('Copied to clipboard', 'success');
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
    { id: 'generations', label: 'Generations', count: generations.length },
    { id: 'ai-text', label: 'AI Text' },
    { id: 'queue', label: 'Queue' },
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
          <div className="ml-auto">
            <Button variant="secondary" size="sm" onClick={handleExportProject}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </Button>
          </div>
        </div>
        {project.description && <p className="text-sm text-[var(--text-secondary)] ml-8">{project.description}</p>}
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'product' && (
          <div className="space-y-6">
            {/* Product Images */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative transition-colors ${isDragging ? 'bg-primary-50 dark:bg-primary-900/10 rounded-xl border-2 border-dashed border-primary-400 p-8' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Product Images</h3>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Import
                </Button>
              </div>

              {assets.length === 0 ? (
                <EmptyState
                  icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>}
                  title="No product images"
                  description="Drag and drop images here or click Import."
                  action={<Button onClick={() => fileInputRef.current?.click()}>Import Images</Button>}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {assets.map(asset => (
                    <Card key={asset.id} hoverable className="overflow-hidden group relative" onClick={() => setSelectedAsset(asset)}>
                      <div className="aspect-square bg-[var(--bg-hover)]">
                        <img src={asset.thumbnailPath} alt={asset.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{asset.name}</p>
                      </div>
                      {selectedAsset?.id === asset.id && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="primary">Selected</Badge>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Product Analysis */}
            {selectedAsset && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Product Analysis</h3>
                  <Button size="sm" onClick={() => handleAnalyzeProduct(selectedAsset)} disabled={analyzing}>
                    {analyzing ? <Spinner size="sm" /> : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analyze Product
                      </>
                    )}
                  </Button>
                </div>

                {analysis ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">Category</p>
                        <p className="text-sm text-[var(--text-primary)]">{analysis.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">Product Name</p>
                        <p className="text-sm text-[var(--text-primary)]">{analysis.productName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Colors</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.colors.map((c, i) => <Badge key={i}>{c}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Materials</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.materials.map((m, i) => <Badge key={i}>{m}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.features.map((f, i) => <Badge key={i}>{f}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Confidence: {Math.round(analysis.confidence * 100)}%</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">Select a product image and click "Analyze Product" to get AI-powered product insights.</p>
                )}
              </Card>
            )}

            {/* Generate Product Photo */}
            {selectedAsset && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Generate Product Photo</h3>
                <div className="space-y-3">
                  <Textarea
                    label="What do you want to generate?"
                    placeholder="e.g., Product on a marble surface with soft lighting"
                    value={photoGoal}
                    onChange={e => setPhotoGoal(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Style" value={photoStyle} onChange={e => setPhotoStyle(e.target.value)} />
                    <Input label="Background" value={photoBackground} onChange={e => setPhotoBackground(e.target.value)} />
                  </div>
                  <Select
                    label="Aspect Ratio"
                    options={[
                      { value: '1:1', label: '1:1 (Square)' },
                      { value: '4:3', label: '4:3' },
                      { value: '16:9', label: '16:9 (Landscape)' },
                      { value: '3:4', label: '3:4 (Portrait)' },
                      { value: '9:16', label: '9:16 (Story)' },
                    ]}
                    value={photoAspectRatio}
                    onChange={e => setPhotoAspectRatio(e.target.value)}
                  />
                  <Button onClick={handleGeneratePhoto} disabled={generating || !photoGoal.trim()}>
                    {generating ? <Spinner size="sm" /> : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Improve */}
            {selectedAsset && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Improve Image</h3>
                <div className="space-y-3">
                  <Textarea
                    label="What would you like to change?"
                    placeholder="e.g., Remove the background, make it brighter, add shadows"
                    value={improveInstruction}
                    onChange={e => setImproveInstruction(e.target.value)}
                  />
                  <Button variant="secondary" onClick={() => setShowImproveDialog(true)} disabled={!improveInstruction.trim()}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Improve
                  </Button>
                </div>
              </Card>
            )}

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary-50/80 dark:bg-primary-900/20 rounded-xl z-10 pointer-events-none">
                <p className="text-primary-600 font-medium">Drop to import</p>
              </div>
            )}

            {isImporting && (
              <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-overlay)] z-50">
                <div className="text-center">
                  <Spinner size="lg" className="mx-auto mb-2" />
                  <p className="text-sm text-white">Importing...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generations' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Generation History</h3>
            {generations.length === 0 ? (
              <EmptyState
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
                title="No generations yet"
                description="Generate product photos or AI text to see them here."
              />
            ) : (
              <div className="space-y-3">
                {generations.map(gen => (
                  <Card key={gen.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={gen.status === 'completed' ? 'success' : gen.status === 'failed' ? 'danger' : 'warning'}>
                            {gen.status}
                          </Badge>
                          <span className="text-xs text-[var(--text-tertiary)]">{gen.type}</span>
                        </div>
                        {gen.prompt && <p className="text-sm text-[var(--text-primary)]">{gen.prompt}</p>}
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatRelativeDate(gen.createdAt)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai-text' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">AI Text Generation</h3>
              <div className="space-y-3">
                <Select
                  label="Content Type"
                  options={[
                    { value: 'PRODUCT_NAME', label: 'Product Name' },
                    { value: 'SHORT_DESCRIPTION', label: 'Short Description' },
                    { value: 'LONG_DESCRIPTION', label: 'Long Description' },
                    { value: 'BULLETS', label: 'Bullet Points' },
                    { value: 'FEATURES', label: 'Features' },
                    { value: 'BENEFITS', label: 'Benefits' },
                    { value: 'SEO', label: 'SEO Content' },
                    { value: 'AD_COPY', label: 'Ad Copy' },
                    { value: 'SOCIAL', label: 'Social Media Post' },
                    { value: 'MARKETPLACE', label: 'Marketplace Listing' },
                    { value: 'CUSTOM', label: 'Custom' },
                  ]}
                  value={textType}
                  onChange={e => setTextType(e.target.value as AITextType)}
                />
                <Button onClick={handleGenerateText} disabled={generatingText}>
                  {generatingText ? <Spinner size="sm" /> : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {textResult && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Generated Text</h4>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopyText}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleGenerateText}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-lg p-3">
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{textResult}</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <QueueUI projectId={projectId} />
        )}
      </div>

      {/* Result Viewer */}
      {showViewer && generatedImages.length > 0 && (
        <ResultViewer
          images={generatedImages}
          initialIndex={viewerIndex}
          onClose={() => setShowViewer(false)}
          onImprove={(idx) => {
            setShowViewer(false);
            setShowImproveDialog(true);
          }}
        />
      )}

      {/* Improve Dialog */}
      <Dialog
        open={showImproveDialog}
        onClose={() => setShowImproveDialog(false)}
        title="Improve Image"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowImproveDialog(false)}>Cancel</Button>
            <Button onClick={handleImprove} disabled={improving || !improveInstruction.trim()}>
              {improving ? <Spinner size="sm" /> : 'Improve'}
            </Button>
          </>
        }
      >
        <Textarea
          label="What would you like to change?"
          placeholder="e.g., Remove the background, make colors more vibrant..."
          value={improveInstruction}
          onChange={e => setImproveInstruction(e.target.value)}
          autoFocus
        />
      </Dialog>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple className="hidden" onChange={handleFileInput} />
    </div>
  );
};
