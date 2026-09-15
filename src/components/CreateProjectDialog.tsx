import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button, Input, Textarea } from '../components/ui';
import { createNewProject } from '../lib/utils';
import type { Project } from '../lib/contracts';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError(t('createProject.projectNameRequired'));
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
      title={t('createProject.createNewProject')}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleCreate}>{t('createProject.createProject')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t('createProject.projectName')}
          placeholder={t('createProject.projectNamePlaceholder')}
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          error={error}
          autoFocus
        />
        <Textarea
          label={t('createProject.description')}
          placeholder={t('createProject.descriptionPlaceholder')}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
    </Dialog>
  );
};
