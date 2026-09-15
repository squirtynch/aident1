// Result Viewer - View generated images with zoom, fullscreen, navigation

import React, { useState, useEffect } from 'react';
import { IconButton, Button, Tooltip } from './ui';

interface ResultViewerProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  onFavorite?: (index: number) => void;
  onImprove?: (index: number) => void;
  onVariation?: (index: number) => void;
  onDownload?: (index: number) => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  images,
  initialIndex = 0,
  onClose,
  onFavorite,
  onImprove,
  onVariation,
  onDownload,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) {
          setFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => Math.max(0, i - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex(i => Math.min(images.length - 1, i + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen, images.length, onClose]);

  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.25));
  const handleFit = () => setZoom(1);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentIndex);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = images[currentIndex];
      link.download = `generation-${currentIndex + 1}.png`;
      link.click();
    }
  };

  if (images.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${fullscreen ? 'bg-black' : 'bg-[var(--bg-overlay)]'}`} onClick={onClose}>
      <div className="relative w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content="Zoom Out">
              <IconButton size="sm" onClick={handleZoomOut} className="text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </IconButton>
            </Tooltip>
            <span className="text-xs px-2">{Math.round(zoom * 100)}%</span>
            <Tooltip content="Zoom In">
              <IconButton size="sm" onClick={handleZoomIn} className="text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </IconButton>
            </Tooltip>
            <Tooltip content="Fit to Screen">
              <IconButton size="sm" onClick={handleFit} className="text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </IconButton>
            </Tooltip>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Tooltip content="Fullscreen">
              <IconButton size="sm" onClick={() => setFullscreen(!fullscreen)} className="text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </IconButton>
            </Tooltip>
            <Tooltip content="Download">
              <IconButton size="sm" onClick={handleDownload} className="text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </IconButton>
            </Tooltip>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Tooltip content="Close">
              <IconButton size="sm" onClick={onClose} className="text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-8">
          <div className="relative">
            <img
              src={images[currentIndex]}
              alt={`Generation ${currentIndex + 1}`}
              style={{ transform: `scale(${zoom})` }}
              className="max-w-full max-h-full transition-transform duration-200"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
          <div className="flex items-center gap-2">
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="text-white hover:bg-white/10"
                >
                  ← Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(i => Math.min(images.length - 1, i + 1))}
                  disabled={currentIndex === images.length - 1}
                  className="text-white hover:bg-white/10"
                >
                  Next →
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onFavorite && (
              <Tooltip content="Favorite">
                <IconButton size="sm" onClick={() => onFavorite(currentIndex)} className="text-white hover:bg-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </IconButton>
              </Tooltip>
            )}
            {onImprove && (
              <Tooltip content="Improve">
                <IconButton size="sm" onClick={() => onImprove(currentIndex)} className="text-white hover:bg-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </IconButton>
              </Tooltip>
            )}
            {onVariation && (
              <Tooltip content="Generate Variation">
                <IconButton size="sm" onClick={() => onVariation(currentIndex)} className="text-white hover:bg-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
