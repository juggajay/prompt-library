import { useState } from 'react';
import { Sparkles, Check, X, Copy, Loader2, TrendingUp } from 'lucide-react';
import type { ImprovementResult } from '../../types/improvement';

interface PromptImprovementProps {
  originalPrompt: string;
  onAccept?: (improvedPrompt: string, improvementId?: string) => void;
  onReject?: () => void;
}

export function PromptImprovement({
  originalPrompt,
  onAccept,
  onReject
}: PromptImprovementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImprovementResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleImprove = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: originalPrompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve prompt');
      }

      const data: ImprovementResult = await response.json();
      setResult(data);
      setShowComparison(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptImprovement = () => {
    if (result && onAccept) {
      onAccept(result.improved_prompt, result.improvement_id);
    }
  };

  const handleRejectImprovement = () => {
    setResult(null);
    setShowComparison(false);
    if (onReject) {
      onReject();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!result) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleImprove}
          disabled={loading || !originalPrompt || originalPrompt.length < 10}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r
                     from-purple-600 to-blue-600 text-white rounded-lg font-medium
                     hover:from-purple-700 hover:to-blue-700 disabled:opacity-50
                     disabled:cursor-not-allowed transition-all shadow-md
                     hover:shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Improving...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Improve with AI
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          label="Clarity"
          score={result.clarity_score}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <ScoreCard
          label="Specificity"
          score={result.specificity_score}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <ScoreCard
          label="Structure"
          score={result.structure_score}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <ScoreCard
          label="Overall"
          score={result.overall_score}
          icon={<TrendingUp className="w-4 h-4" />}
          highlighted
        />
      </div>

      {/* Toggle View Button */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
      >
        {showComparison ? 'Hide' : 'Show'} side-by-side comparison
      </button>

      {/* Comparison View */}
      {showComparison && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-300">Original</h4>
              <button
                onClick={() => copyToClipboard(originalPrompt)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10
                            min-h-[200px] text-sm text-gray-300">
              {originalPrompt}
            </div>
          </div>

          {/* Improved */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-green-400">Improved</h4>
              <button
                onClick={() => copyToClipboard(result.improved_prompt)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20
                            min-h-[200px] text-sm text-white">
              {result.improved_prompt}
            </div>
          </div>
        </div>
      )}

      {/* Changes Made */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-300">
          What Changed? {result.cached && <span className="text-xs text-gray-500">(Cached)</span>}
        </h4>
        <ul className="space-y-2">
          {result.changes_made.map((change, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{change}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reasoning */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Why these changes?</strong> {result.reasoning}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAcceptImprovement}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2
                     bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                     font-medium hover:from-green-500 hover:to-emerald-500 transition-all
                     shadow-lg shadow-green-500/20"
        >
          <Check className="w-4 h-4" />
          Use Improved Version
        </button>
        <button
          onClick={handleRejectImprovement}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2
                     bg-white/5 border border-white/10 text-gray-300 rounded-lg
                     font-medium hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
          Keep Original
        </button>
      </div>

      {/* Metadata (development only) */}
      {result.metadata && process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-400">Debug Info</summary>
          <pre className="mt-2 p-2 bg-white/5 rounded overflow-x-auto text-gray-400">
            {JSON.stringify(result.metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Score Card Component
function ScoreCard({
  label,
  score,
  icon,
  highlighted = false
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  const percentage = Math.round(score * 100);
  const color = highlighted
    ? 'from-purple-600 to-blue-600'
    : score >= 0.8
    ? 'from-green-600 to-emerald-600'
    : score >= 0.6
    ? 'from-yellow-600 to-orange-600'
    : 'from-red-600 to-rose-600';

  return (
    <div
      className={`p-4 rounded-lg border ${
        highlighted
          ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <div className="text-gray-500">{icon}</div>
      </div>
      <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {percentage}%
      </div>
    </div>
  );
}
