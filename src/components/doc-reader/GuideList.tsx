import { useEffect, useState } from 'react';
import { fetchGuides, type Guide } from '../../services/docReaderService';

interface GuideListProps {
  refreshTrigger: number;
  selectedGuideId: string | null;
  onSelectGuide: (id: string) => void;
}

export function GuideList({ refreshTrigger, selectedGuideId, onSelectGuide }: GuideListProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGuides();
  }, [refreshTrigger]);

  const loadGuides = async () => {
    try {
      const data = await fetchGuides();
      setGuides(data.guides || []);
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      queued: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-300 border-red-500/30',
      pending: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          badges[status as keyof typeof badges] || badges.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Your Guides</h2>
        <p className="text-sm text-gray-400 mt-1">{guides.length} total</p>
      </div>

      <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
        {guides.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            No guides yet. Create one by entering a URL above.
          </div>
        ) : (
          guides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => onSelectGuide(guide.id)}
              className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${
                selectedGuideId === guide.id ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {guide.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-1">{guide.source_url}</p>
                  <div className="mt-2">{getStatusBadge(guide.processing_status)}</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
