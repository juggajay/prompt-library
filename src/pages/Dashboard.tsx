import { useState, useRef, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { PromptCard } from '../components/prompts/PromptCard';
import { CreatePromptForm } from '../components/prompts/CreatePromptForm';
import { EditPromptForm } from '../components/prompts/EditPromptForm';
import { SearchBar } from '../components/features/SearchBar';
import { FilterBar } from '../components/features/FilterBar';
import { FolderSidebar } from '../components/features/FolderSidebar';
import { KeyboardShortcutsHelp } from '../components/features/KeyboardShortcutsHelp';
import { usePrompts, useDeletePrompt, useToggleFavorite, useIncrementUsage } from '../hooks/usePrompts';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { toast } from 'sonner';
import { exportPrompts, type ExportFormat } from '../utils/export';
import type { Category, PromptFilters, Prompt } from '../types';

export function Dashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<PromptFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = usePrompts(filters);
  const deletePrompt = useDeletePrompt();
  const toggleFavorite = useToggleFavorite();
  const incrementUsage = useIncrementUsage();

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query || undefined }));
  };

  const handleCategoryChange = (category: Category | undefined) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handleFolderSelect = (folderId: string | undefined) => {
    setFilters((prev) => ({ ...prev, folderId }));
  };

  const handleToggleFavorites = () => {
    setFilters((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({ ...prev, sortBy: sortBy as any }));
  };

  const handleCopy = async (text: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await incrementUsage.mutateAsync(promptId);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      await deletePrompt.mutateAsync(id);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    await toggleFavorite.mutateAsync({ id, isFavorite });
  };

  const handleExport = (format: ExportFormat) => {
    if (!data || data.prompts.length === 0) {
      toast.error('No prompts to export');
      return;
    }

    try {
      exportPrompts(data.prompts, format);
      toast.success(`Exported ${data.prompts.length} prompts as ${format.toUpperCase()}`);
      setShowExportMenu(false);
    } catch (error) {
      toast.error('Failed to export prompts');
      console.error(error);
    }
  };

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      handler: () => {
        // Focus search input
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'n',
      ctrlKey: true,
      metaKey: true,
      handler: () => {
        if (!showCreateForm && !editingPrompt) {
          setShowCreateForm(true);
        }
      },
      description: 'New prompt',
    },
    {
      key: 'e',
      ctrlKey: true,
      metaKey: true,
      handler: () => {
        if (!showCreateForm && !editingPrompt) {
          setShowExportMenu(!showExportMenu);
        }
      },
      description: 'Export prompts',
    },
    {
      key: 'Escape',
      handler: () => {
        setShowCreateForm(false);
        setEditingPrompt(null);
        setShowExportMenu(false);
        setShowShortcutsHelp(false);
      },
      description: 'Close modal',
    },
    {
      key: '?',
      shiftKey: true,
      handler: () => {
        setShowShortcutsHelp(!showShortcutsHelp);
      },
      description: 'Show keyboard shortcuts',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">My Prompts</h1>
            <p className="text-gray-300 mt-1">
              {data?.total || 0} prompt{data?.total !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <div className="flex gap-3">
            {/* Export Button with Dropdown */}
            <div className="relative">
              <Button
                onClick={() => setShowExportMenu(!showExportMenu)}
                variant="outline"
                className="flex items-center gap-2 bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </Button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-purple-500/20 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      Export as Markdown
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/50"
            >
              <Plus className="w-5 h-5" />
              <span>New Prompt</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            <FolderSidebar
              selectedFolderId={filters.folderId}
              onFolderSelect={handleFolderSelect}
            />
            <FilterBar
              selectedCategory={filters.category}
              onCategoryChange={handleCategoryChange}
              showFavoritesOnly={filters.isFavorite || false}
              onToggleFavorites={handleToggleFavorites}
              sortBy={filters.sortBy || 'created_at'}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Prompts Grid */}
          <div className="lg:col-span-3">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-gray-300">Loading prompts...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-400">Error loading prompts. Please try again.</p>
              </div>
            )}

            {data && data.prompts.length === 0 && (
              <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <p className="text-gray-200 text-lg mb-4">No prompts found</p>
                <p className="text-gray-400 mb-6">
                  {filters.search || filters.category || filters.isFavorite
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first prompt'}
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/50"
                >
                  Create Your First Prompt
                </Button>
              </div>
            )}

            {data && data.prompts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={() => setEditingPrompt(prompt)}
                    onDelete={handleDelete}
                    onCopy={(text) => handleCopy(text, prompt.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Prompt Modal */}
      {showCreateForm && <CreatePromptForm onClose={() => setShowCreateForm(false)} />}

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <EditPromptForm prompt={editingPrompt} onClose={() => setEditingPrompt(null)} />
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcutsHelp && (
        <KeyboardShortcutsHelp
          shortcuts={shortcuts}
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}
    </AppLayout>
  );
}
