import React from 'react';

interface DragDropOverlayProps {
  active: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="drag-overlay">
      <div className="flex flex-col items-center gap-3 text-primary-600">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-lg font-semibold">Drop images to import</p>
        <p className="text-sm text-primary-500">PNG, JPG, JPEG, WebP supported</p>
      </div>
    </div>
  );
};
