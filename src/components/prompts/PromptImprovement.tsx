import { useState } from 'react';
import { Sparkles, Check, X, Copy, Loader2, Edit2 } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

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
      setEditedPrompt(data.improved_prompt); // Initialize edited version
      setShowComparison(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptImprovement = () => {
    if (result && onAccept) {
      // Use edited version if in edit mode, otherwise use original improved version
      const finalPrompt = isEditing ? editedPrompt : result.improved_prompt;
      onAccept(finalPrompt, result.improvement_id);
    }
  };

  const handleStartEditing = () => {
    setEditedPrompt(result?.improved_prompt || '');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditedPrompt(result?.improved_prompt || '');
    setIsEditing(false);
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
      <div className="grid grid-cols-2 gap-3 w-full">
        <ScoreCard
          label="Clarity"
          score={result.clarity_score}
        />
        <ScoreCard
          label="Specificity"
          score={result.specificity_score}
        />
        <ScoreCard
          label="Structure"
          score={result.structure_score}
        />
        <ScoreCard
          label="Overall"
          score={result.overall_score}
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
        <div className="grid grid-cols-2 gap-4">
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
                            text-sm text-gray-300 whitespace-pre-wrap">
              {originalPrompt}
            </div>
          </div>

          {/* Improved */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-green-400">
                {isEditing ? 'Editing Improved Version' : 'Improved'}
              </h4>
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    onClick={handleStartEditing}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Edit improved version"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(isEditing ? editedPrompt : result.improved_prompt)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full p-4 bg-green-500/10 border border-green-500/30 rounded-lg
                           text-sm text-white focus:outline-none focus:ring-2
                           focus:ring-green-500 focus:border-green-500 resize-y"
                rows={20}
              />
            ) : (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20
                              text-sm text-white whitespace-pre-wrap">
                {result.improved_prompt}
              </div>
            )}
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

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300">
            ✏️ You're editing the improved version. Click "Save Edits" when done, or "Cancel" to revert changes.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setIsEditing(false);
                // Keep the edited version for saving
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2
                         bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                         font-medium hover:from-green-500 hover:to-emerald-500 transition-all
                         shadow-lg shadow-green-500/20"
            >
              <Check className="w-4 h-4" />
              Save Edits
            </button>
            <button
              onClick={handleCancelEditing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2
                         bg-white/5 border border-white/10 text-gray-300 rounded-lg
                         font-medium hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAcceptImprovement}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2
                         bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                         font-medium hover:from-green-500 hover:to-emerald-500 transition-all
                         shadow-lg shadow-green-500/20"
            >
              <Check className="w-4 h-4" />
              {editedPrompt !== result.improved_prompt ? 'Use Edited Version' : 'Use Improved Version'}
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
          </>
        )}
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
  highlighted = false
}: {
  label: string;
  score: number;
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
      className={`p-3 rounded-lg border h-full flex flex-col justify-center ${
        highlighted
          ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="text-center">
        <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}>
          {percentage}%
        </div>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
    </div>
  );
}
