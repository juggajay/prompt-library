import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatInterface } from './ChatInterface';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchGuide, deleteGuide, type Guide } from '../../services/docReaderService';

interface GuideViewerProps {
  guideId: string;
  onGuideDeleted?: (id: string) => void;
}

export function GuideViewer({ guideId, onGuideDeleted }: GuideViewerProps) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadGuide();
    // Poll for updates if processing
    const interval = setInterval(() => {
      if (guide?.processing_status !== 'completed') {
        loadGuide();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [guideId]);

  const loadGuide = async () => {
    try {
      const data = await fetchGuide(guideId);
      setGuide(data);
    } catch (error) {
      console.error('Failed to fetch guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGuide = async () => {
    if (isDeleting) return;
    if (!window.confirm('Delete this guide? Processed content and chat history will be removed.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteGuide(guideId);
      toast.success('Guide deleted successfully');
      onGuideDeleted?.(guideId);
      setGuide(null);
    } catch (error) {
      console.error('Failed to delete guide:', error);
      toast.error('Failed to delete guide');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <p className="text-center text-gray-400">Guide not found</p>
      </div>
    );
  }

  if (guide.processing_status !== 'completed') {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <svg
              className="animate-spin h-8 w-8 text-purple-400"
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
          <h3 className="text-lg font-medium text-white mb-2">Processing Documentation</h3>
          <p className="text-sm text-gray-400">
            Status: <span className="font-medium">{guide.processing_status}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">This may take a few minutes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">{guide.title}</h2>
            <a
              href={guide.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 hover:underline mt-1 inline-block"
            >
              {guide.source_url}
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/50"
            >
              {showChat ? 'Hide Chat' : 'Ask Questions'}
            </button>
            <button
              onClick={handleDeleteGuide}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Guide
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Guide Content */}
        <div className="prose prose-invert prose-sm max-w-none overflow-y-auto max-h-[70vh] pr-4">
          <ReactMarkdown
            components={{
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-white/10 px-1 py-0.5 rounded text-sm text-purple-300">{children}</code>
                ) : (
                  <pre className="bg-slate-900/50 text-gray-100 p-4 rounded-lg overflow-x-auto border border-white/10">
                    <code>{children}</code>
                  </pre>
                );
              },
              h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-5 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
              p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 space-y-1 mb-3">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 space-y-1 mb-3">{children}</ol>,
              a: ({ href, children }) => <a href={href} className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
            }}
          >
            {typeof guide.content?.processed_content === 'object'
              ? (guide.content?.processed_content as any)?.markdown || ''
              : guide.content?.processed_content || ''}
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
