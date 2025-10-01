import { AppLayout } from '../components/layout/AppLayout';
import { usePrompts } from '../hooks/usePrompts';
import { BarChart3, TrendingUp, Star, FolderOpen } from 'lucide-react';
import { CATEGORIES } from '../types';

export function Analytics() {
  const { data } = usePrompts({});

  const prompts = data?.prompts || [];
  const total = prompts.length;
  const favorites = prompts.filter(p => p.is_favorite).length;
  const totalUsage = prompts.reduce((sum, p) => sum + p.use_count, 0);
  const avgUsage = total > 0 ? (totalUsage / total).toFixed(1) : '0';

  // Category breakdown
  const categoryStats = CATEGORIES.map(category => ({
    name: category,
    count: prompts.filter(p => p.category === category).length,
    percentage: total > 0 ? ((prompts.filter(p => p.category === category).length / total) * 100).toFixed(1) : '0'
  })).filter(cat => cat.count > 0);

  // Most used prompts
  const mostUsed = [...prompts]
    .sort((a, b) => b.use_count - a.use_count)
    .slice(0, 5);

  // Recent activity
  const recentlyUsed = [...prompts]
    .filter(p => p.last_used_at)
    .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-gray-300 mt-1">Insights into your prompt library</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-gray-300 text-sm font-medium">Total Prompts</h3>
            </div>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                <Star className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h3 className="text-gray-300 text-sm font-medium">Favorites</h3>
            </div>
            <p className="text-3xl font-bold text-white">{favorites}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-gray-300 text-sm font-medium">Total Usage</h3>
            </div>
            <p className="text-3xl font-bold text-white">{totalUsage}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-gray-300 text-sm font-medium">Avg. Usage</h3>
            </div>
            <p className="text-3xl font-bold text-white">{avgUsage}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Category Distribution
            </h3>
            <div className="space-y-4">
              {categoryStats.map((cat, idx) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">{cat.name}</span>
                    <span className="text-gray-400">{cat.count} ({cat.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-gray-400 text-center py-4">No prompts yet</p>
              )}
            </div>
          </div>

          {/* Most Used Prompts */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Most Used Prompts
            </h3>
            <div className="space-y-3">
              {mostUsed.map((prompt, idx) => (
                <div
                  key={prompt.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{prompt.title}</p>
                    <p className="text-gray-400 text-sm">{prompt.use_count} uses</p>
                  </div>
                </div>
              ))}
              {mostUsed.length === 0 && (
                <p className="text-gray-400 text-center py-4">No usage data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recently Used */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Used</h3>
          <div className="space-y-3">
            {recentlyUsed.map((prompt) => (
              <div
                key={prompt.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{prompt.title}</p>
                  <p className="text-gray-400 text-sm">{prompt.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">
                    {new Date(prompt.last_used_at!).toLocaleDateString()}
                  </p>
                  <p className="text-purple-400 text-xs">{prompt.use_count} uses</p>
                </div>
              </div>
            ))}
            {recentlyUsed.length === 0 && (
              <p className="text-gray-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
