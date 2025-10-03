'use client';

import { useState } from 'react';
import { UrlInput } from '@/components/url-input';
import { GuideList } from '@/components/guide-list';
import { GuideViewer } from '@/components/guide-viewer';

export default function Home() {
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGuideProcessed = (guideId: string) => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedGuideId(guideId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Doc Reader</h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-Powered Documentation Guide Generator
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL Input */}
        <div className="mb-8">
          <UrlInput onGuideProcessed={handleGuideProcessed} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Guide List */}
          <div className="lg:col-span-1">
            <GuideList
              refreshTrigger={refreshTrigger}
              selectedGuideId={selectedGuideId}
              onSelectGuide={setSelectedGuideId}
            />
          </div>

          {/* Main Content - Guide Viewer */}
          <div className="lg:col-span-2">
            {selectedGuideId ? (
              <GuideViewer guideId={selectedGuideId} />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No guide selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter a documentation URL above or select a guide from the list
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Built with Next.js, OpenAI, and Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
