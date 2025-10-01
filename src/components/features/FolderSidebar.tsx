import { useState } from 'react';
import { Folder, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from '../../hooks/useFolders';
import type { Folder as FolderType } from '../../types';

interface FolderSidebarProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | undefined) => void;
}

export function FolderSidebar({ selectedFolderId, onFolderSelect }: FolderSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#8b5cf6');

  const { data: folders = [] } = useFolders();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const colors = [
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f97316', // orange
  ];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    await createFolder.mutateAsync({
      name: newFolderName,
      color: newFolderColor,
    });

    setNewFolderName('');
    setNewFolderColor('#8b5cf6');
    setShowCreateForm(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    await updateFolder.mutateAsync({
      id: editingFolder.id,
      updates: {
        name: newFolderName,
        color: newFolderColor,
      },
    });

    setEditingFolder(null);
    setNewFolderName('');
    setNewFolderColor('#8b5cf6');
  };

  const handleDeleteFolder = async (id: string) => {
    if (window.confirm('Delete this folder? Prompts inside will not be deleted.')) {
      await deleteFolder.mutateAsync(id);
      if (selectedFolderId === id) {
        onFolderSelect(undefined);
      }
    }
  };

  const startEdit = (folder: FolderType) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color || '#8b5cf6');
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingFolder(null);
    setShowCreateForm(false);
    setNewFolderName('');
    setNewFolderColor('#8b5cf6');
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Folder className="w-5 h-5 text-purple-400" />
          Folders
        </h3>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingFolder(null);
          }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-purple-400" />
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingFolder) && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-3">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="text-sm"
          />

          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setNewFolderColor(color)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  newFolderColor === color ? 'scale-125 ring-2 ring-white' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm"
            >
              {editingFolder ? 'Update' : 'Create'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEdit}
              className="flex-1 bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* All Prompts */}
      <button
        onClick={() => onFolderSelect(undefined)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
          selectedFolderId === undefined
            ? 'bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30'
            : 'hover:bg-white/5'
        }`}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: '#8b5cf6' }}
        />
        <span className="text-white text-sm flex-1 text-left">All Prompts</span>
      </button>

      {/* Unorganized */}
      <button
        onClick={() => onFolderSelect('unorganized')}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
          selectedFolderId === 'unorganized'
            ? 'bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30'
            : 'hover:bg-white/5'
        }`}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: '#6b7280' }}
        />
        <span className="text-white text-sm flex-1 text-left">Unorganized</span>
      </button>

      {/* Folders List */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
              selectedFolderId === folder.id
                ? 'bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30'
                : 'hover:bg-white/5'
            }`}
          >
            <button
              onClick={() => onFolderSelect(folder.id)}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: folder.color || '#8b5cf6' }}
              />
              <span className="text-white text-sm truncate">{folder.name}</span>
            </button>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(folder)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Edit2 className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
              <button
                onClick={() => handleDeleteFolder(folder.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {folders.length === 0 && !showCreateForm && (
        <div className="text-center py-6 text-gray-400 text-sm">
          <p>No folders yet</p>
          <p className="text-xs mt-1">Create one to organize your prompts</p>
        </div>
      )}
    </div>
  );
}
