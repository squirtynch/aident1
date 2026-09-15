import React, { useState } from 'react';
import { Dialog, Button, Input, Textarea } from '../components/ui';
import { createNewProject } from '../lib/utils';
import type { Project } from '../lib/contracts';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    const project = createNewProject(name.trim(), description.trim());
    setName('');
    setDescription('');
    setError('');
    onCreated(project);
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create New Project"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create Project</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g., Summer Collection 2024"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          error={error}
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          placeholder="Brief description of the project..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
    </Dialog>
  );
};
