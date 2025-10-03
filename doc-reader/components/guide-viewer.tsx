'use client';

import { useEffect, useState } from 'react';
import  ReactMarkdown from 'react-markdown';
import { ChatInterface } from './chat-interface';

interface Guide {
  id: string;
  title: string;
  source_url: string;
  processing_status: string;
  content?: {
    processed_content: string;
    metadata?: any;
  };
}

interface GuideViewerProps {
  guideId: string;
}

export function GuideViewer({ guideId }: GuideViewerProps) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchGuide();
    // Poll for updates if processing
    const interval = setInterval(() => {
      if (guide?.processing_status !== 'completed') {
        fetchGuide();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [guideId]);

  const fetchGuide = async () => {
    try {
      const response = await fetch(`/api/guides/${guideId}`);
      if (response.ok) {
        const data = await response.json();
        setGuide(data);
      }
    } catch (error) {
      console.error('Failed to fetch guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-center text-gray-500">Guide not found</p>
      </div>
    );
  }

  if (guide.processing_status !== 'completed') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Documentation</h3>
          <p className="text-sm text-gray-500">
            Status: <span className="font-medium">{guide.processing_status}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">This may take a few minutes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{guide.title}</h2>
            <a
              href={guide.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
            >
              {guide.source_url}
            </a>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            {showChat ? 'Hide Chat' : 'Ask Questions'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Guide Content */}
        <div className="prose prose-sm max-w-none overflow-y-auto max-h-[70vh]">
          <ReactMarkdown
            components={{
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
                ) : (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{children}</code>
                  </pre>
                );
              },
            }}
          >
            {guide.content?.processed_content || ''}
          </ReactMarkdown>
        </div>

        {/* Chat Interface */}
        {showChat && (
          <div className="lg:sticky lg:top-6">
            <ChatInterface guideId={guideId} />
          </div>
        )}
      </div>
    </div>
  );
}
