import { Filter, Star } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CATEGORIES, type Category } from '../../types';

interface FilterBarProps {
  selectedCategory?: Category;
  onCategoryChange: (category: Category | undefined) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  showFavoritesOnly,
  onToggleFavorites,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">Filters</h3>
      </div>

      {/* Favorites Filter */}
      <div>
        <button
          onClick={onToggleFavorites}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            showFavoritesOnly
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-400' : ''}`} />
          <span>Favorites Only</span>
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          <Badge
            className={`cursor-pointer ${
              !selectedCategory ? 'bg-blue-600 text-white' : ''
            }`}
            onClick={() => onCategoryChange(undefined)}
          >
            All
          </Badge>
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              className={`cursor-pointer ${
                selectedCategory === category ? 'bg-blue-600 text-white' : ''
              }`}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="created_at">Date Created</option>
          <option value="updated_at">Last Updated</option>
          <option value="title">Title</option>
          <option value="use_count">Most Used</option>
        </select>
      </div>
    </div>
  );
}
