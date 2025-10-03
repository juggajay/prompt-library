'use client';

import { useEffect, useState } from 'react';

interface Guide {
  id: string;
  title: string;
  source_url: string;
  processing_status: string;
  created_at: string;
}

interface GuideListProps {
  refreshTrigger: number;
  selectedGuideId: string | null;
  onSelectGuide: (id: string) => void;
}

export function GuideList({ refreshTrigger, selectedGuideId, onSelectGuide }: GuideListProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGuides();
  }, [refreshTrigger]);

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/guides');
      if (response.ok) {
        const data = await response.json();
        setGuides(data.guides || []);
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      queued: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges] || badges.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Your Guides</h2>
        <p className="text-sm text-gray-500 mt-1">{guides.length} total</p>
      </div>

      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {guides.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No guides yet. Create one by entering a URL above.
          </div>
        ) : (
          guides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => onSelectGuide(guide.id)}
              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                selectedGuideId === guide.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {guide.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-1">{guide.source_url}</p>
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
