import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, EmptyState, Dialog, IconButton, Badge, Tabs } from '../components/ui';
import { libraryService } from '../lib/library';
import type { LibraryItemExtended, LibraryItemType } from '../lib/contracts';

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<LibraryItemExtended[]>([]);
  const [activeTab, setActiveTab] = useState<LibraryItemType>('model');
  const [search, setSearch] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItemExtended | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    imagePath: '',
  });

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const loadItems = () => {
    const filtered = search ? libraryService.search(search, activeTab) : libraryService.getAll(activeTab);
    setItems(filtered);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    const filtered = value ? libraryService.search(value, activeTab) : libraryService.getAll(activeTab);
    setItems(filtered);
  };

  const handleCreate = () => {
    setFormData({ name: '', description: '', tags: '', imagePath: '' });
    setEditingItem(null);
    setCreateDialog(true);
  };

  const handleEdit = (item: LibraryItemExtended) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      tags: item.tags.join(', '),
      imagePath: item.imagePath || '',
    });
    setEditingItem(item);
    setCreateDialog(true);
  };

  const handleSave = () => {
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (editingItem) {
      libraryService.update(editingItem.id, {
        name: formData.name,
        description: formData.description,
        tags,
        imagePath: formData.imagePath,
      });
    } else {
      libraryService.create({
        type: activeTab,
        name: formData.name,
        description: formData.description,
        tags,
        imagePath: formData.imagePath,
        thumbnailPath: formData.imagePath,
        favorite: false,
      });
    }

    setCreateDialog(false);
    loadItems();
  };

  const handleDelete = (id: string) => {
    if (confirm(t('library.deleteConfirm'))) {
      libraryService.delete(id);
      loadItems();
    }
  };

  const handleToggleFavorite = (id: string) => {
    libraryService.toggleFavorite(id);
    loadItems();
  };

  const tabs = [
    { id: 'model' as LibraryItemType, label: t('library.models') },
    { id: 'environment' as LibraryItemType, label: t('library.environments') },
    { id: 'design_reference' as LibraryItemType, label: t('library.designReferences') },
    { id: 'style' as LibraryItemType, label: t('library.styles') },
    { id: 'template' as LibraryItemType, label: t('library.templates') },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('library.title')}</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('library.itemCount', { count: items.length })}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('library.addItem')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as LibraryItemType)} />
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder={t('library.searchPlaceholder')}
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          }
          title={t('library.noItemsYet')}
          description={t('library.addItemsDescription')}
          action={<Button onClick={handleCreate}>{t('library.addItem')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <Card key={item.id} hoverable className="group relative overflow-hidden">
              <div className="aspect-video bg-[var(--bg-hover)] relative">
                {item.imagePath ? (
                  <img src={item.imagePath} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
                {item.favorite && (
                  <div className="absolute top-2 left-2">
                    <svg className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</h4>
                {item.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{item.description}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i}>{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconButton size="sm" onClick={() => handleToggleFavorite(item.id)}>
                  <svg className={`w-3.5 h-3.5 ${item.favorite ? 'text-amber-500 fill-amber-500' : ''}`} fill={item.favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </IconButton>
                <IconButton size="sm" onClick={() => handleEdit(item)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </IconButton>
                <IconButton size="sm" onClick={() => handleDelete(item.id)}>
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        title={editingItem ? t('library.editItem') : t('library.addItem')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('library.name')}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <Input
            label={t('library.description')}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label={t('library.tags')}
            value={formData.tags}
            onChange={e => setFormData({ ...formData, tags: e.target.value })}
          />
          <Input
            label={t('library.imageUrl')}
            value={formData.imagePath}
            onChange={e => setFormData({ ...formData, imagePath: e.target.value })}
          />
        </div>
      </Dialog>
    </div>
  );
};
