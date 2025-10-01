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
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6 shadow-lg">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-white">Filters</h3>
      </div>

      {/* Favorites Filter */}
      <div>
        <button
          onClick={onToggleFavorites}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 w-full ${
            showFavoritesOnly
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          <span className="font-medium">Favorites Only</span>
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          <Badge
            className={`cursor-pointer transition-all hover:scale-105 ${
              !selectedCategory
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-transparent shadow-lg shadow-purple-500/30'
                : 'hover:bg-white/15'
            }`}
            onClick={() => onCategoryChange(undefined)}
          >
            All
          </Badge>
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              className={`cursor-pointer transition-all hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-transparent shadow-lg shadow-purple-500/30'
                  : 'hover:bg-white/15'
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
        <label className="block text-sm font-medium text-white mb-3">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-sm hover:bg-white/10 transition-all"
        >
          <option value="created_at" className="bg-slate-900">Date Created</option>
          <option value="updated_at" className="bg-slate-900">Last Updated</option>
          <option value="title" className="bg-slate-900">Title</option>
          <option value="use_count" className="bg-slate-900">Most Used</option>
        </select>
      </div>
    </div>
  );
}
