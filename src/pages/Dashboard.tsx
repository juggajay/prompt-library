import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { PromptCard } from '../components/prompts/PromptCard';
import { CreatePromptForm } from '../components/prompts/CreatePromptForm';
import { SearchBar } from '../components/features/SearchBar';
import { FilterBar } from '../components/features/FilterBar';
import { usePrompts, useDeletePrompt, useToggleFavorite, useIncrementUsage } from '../hooks/usePrompts';
import { toast } from 'sonner';
import type { Category, PromptFilters } from '../types';

export function Dashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Prompts</h1>
            <p className="text-gray-600 mt-1">
              {data?.total || 0} prompt{data?.total !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Prompt</span>
          </Button>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading prompts...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">Error loading prompts. Please try again.</p>
              </div>
            )}

            {data && data.prompts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 text-lg mb-4">No prompts found</p>
                <p className="text-gray-500 mb-6">
                  {filters.search || filters.category || filters.isFavorite
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first prompt'}
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
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
                    onEdit={(id) => {
                      // TODO: Implement edit modal
                      toast.info('Edit functionality coming soon!');
                    }}
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
    </AppLayout>
  );
}
