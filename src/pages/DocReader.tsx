import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { UrlInput } from '../components/doc-reader/UrlInput';
import { GuideList } from '../components/doc-reader/GuideList';
import { GuideViewer } from '../components/doc-reader/GuideViewer';
import { FileText } from 'lucide-react';

export function DocReader() {
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGuideProcessed = (guideId: string) => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedGuideId(guideId);
  };

  const handleGuideDeleted = (guideId: string) => {
    setSelectedGuideId((current) => (current === guideId ? null : current));
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-xl border border-white/10">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Doc Reader
            </h1>
            <p className="text-gray-300 mt-1">
              AI-Powered Documentation Guide Generator
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div>
          <UrlInput onGuideProcessed={handleGuideProcessed} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Guide List */}
          <div className="lg:col-span-1">
            <GuideList
              refreshTrigger={refreshTrigger}
              selectedGuideId={selectedGuideId}
              onSelectGuide={(id) => setSelectedGuideId(id)}
              onGuideDeleted={handleGuideDeleted}
            />
          </div>

          {/* Main Content - Guide Viewer */}
          <div className="lg:col-span-2">
            {selectedGuideId ? (
              <GuideViewer guideId={selectedGuideId} onGuideDeleted={handleGuideDeleted} />
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
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
                <h3 className="mt-2 text-sm font-medium text-white">No guide selected</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Enter a documentation URL above or select a guide from the list
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
