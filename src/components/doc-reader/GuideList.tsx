import { useEffect, useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchGuides, deleteGuide, type Guide } from '../../services/docReaderService';

interface GuideListProps {
  refreshTrigger: number;
  selectedGuideId: string | null;
  onSelectGuide: (id: string | null) => void;
  onGuideDeleted?: (id: string) => void;
}

export function GuideList({
  refreshTrigger,
  selectedGuideId,
  onSelectGuide,
  onGuideDeleted,
}: GuideListProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteGuide = async (guideId: string) => {
    if (deletingId) return;
    if (!window.confirm('Delete this guide? Processed content and chat history will be removed.')) {
      return;
    }

    setDeletingId(guideId);
    try {
      await deleteGuide(guideId);
      setGuides((prev) => prev.filter((guide) => guide.id !== guideId));
      if (selectedGuideId === guideId) {
        onSelectGuide(null);
      }
      onGuideDeleted?.(guideId);
      toast.success('Guide deleted successfully');
    } catch (error) {
      console.error('Failed to delete guide:', error);
      toast.error('Failed to delete guide');
    } finally {
      setDeletingId(null);
    }
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {guide.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-1">{guide.source_url}</p>
                  <div className="mt-2">{getStatusBadge(guide.processing_status)}</div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteGuide(guide.id);
                  }}
                  className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Delete guide"
                >
                  {deletingId === guide.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
