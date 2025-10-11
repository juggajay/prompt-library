import { useState } from 'react';
import { Send, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { PRDDocument } from '../../types';

interface OptimizationMessage {
  role: 'user' | 'assistant';
  content: string;
  result?: OptimizationResult;
}

interface OptimizationResult {
  summary: string;
  improvements: Array<{
    section: string;
    issue: string;
    recommendation: string;
    benefit: string;
  }>;
  suggested_rewrite: string | null;
  metrics: string[];
  risks: string[];
  next_actions: string[];
  follow_up_question: string;
}

interface PRDStepOptimizeProps {
  generatedDocument: PRDDocument | null;
  onOptimize: (message: string, history: OptimizationMessage[]) => Promise<OptimizationResult>;
  isOptimizing: boolean;
}

export function PRDStepOptimize({
  generatedDocument,
  onOptimize,
  isOptimizing,
}: PRDStepOptimizeProps) {
  const [messages, setMessages] = useState<OptimizationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = async () => {
    if (!inputMessage.trim() || isOptimizing) return;

    const userMessage: OptimizationMessage = {
      role: 'user',
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    try {
      const result = await onOptimize(inputMessage, messages);

      const assistantMessage: OptimizationMessage = {
        role: 'assistant',
        content: result.summary,
        result,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Error handling done in parent
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startConversation = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      {/* Left Panel: PRD Overview */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Your PRD</h3>
        </div>

        {generatedDocument ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-purple-300 mb-1">Project</p>
              <p className="text-white font-medium">{generatedDocument.project_name}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-purple-300 mb-2">Key Sections</p>
              <ul className="space-y-1 text-sm text-gray-300">
                {Object.keys(generatedDocument.content || {}).map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    {formatHeading(key)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 p-4">
              <p className="text-xs uppercase text-purple-300 mb-2">Quick Starters</p>
              <div className="space-y-2">
                <button
                  onClick={() => startConversation('Review my PRD and suggest improvements')}
                  className="w-full text-left text-sm text-purple-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                  💡 Review and suggest improvements
                </button>
                <button
                  onClick={() => startConversation('Help me identify risks and mitigation strategies')}
                  className="w-full text-left text-sm text-purple-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                  ⚠️ Identify risks and mitigation
                </button>
                <button
                  onClick={() => startConversation('Suggest metrics to measure success')}
                  className="w-full text-left text-sm text-purple-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                  📊 Suggest success metrics
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p>Generate a PRD first to start optimizing</p>
          </div>
        )}
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Nova Assistant</h3>
            <p className="text-xs text-gray-400">Your PRD optimization coach</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[500px]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-md space-y-3">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-purple-300" />
                </div>
                <h4 className="text-white font-medium">Ready to refine your PRD?</h4>
                <p className="text-sm text-gray-400">
                  Ask me anything about improving your document, identifying risks, or clarifying requirements.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-200'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <AssistantMessage result={msg.result!} />
                  )}
                </div>
              </div>
            ))
          )}
          {isOptimizing && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Nova to review or improve your PRD..."
            disabled={isOptimizing || !generatedDocument}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isOptimizing || !generatedDocument}
            className="self-end bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
          >
            {isOptimizing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ result }: { result: OptimizationResult }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="leading-relaxed">{result.summary}</p>

      {result.improvements.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="font-semibold text-purple-300 mb-2">📋 Improvements</p>
          <div className="space-y-2">
            {result.improvements.map((imp, idx) => (
              <div key={idx} className="text-xs space-y-1">
                <p className="font-medium text-white">{imp.section}</p>
                <p className="text-gray-400">Issue: {imp.issue}</p>
                <p className="text-green-300">✓ {imp.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.suggested_rewrite && (
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="font-semibold text-purple-300 mb-2">✏️ Suggested Rewrite</p>
          <p className="text-gray-300 text-xs whitespace-pre-wrap">{result.suggested_rewrite}</p>
        </div>
      )}

      {result.metrics.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="font-semibold text-purple-300 mb-2">📊 Success Metrics</p>
          <ul className="text-xs space-y-1">
            {result.metrics.map((metric, idx) => (
              <li key={idx} className="text-gray-300">• {metric}</li>
            ))}
          </ul>
        </div>
      )}

      {result.risks.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="font-semibold text-red-300 mb-2">⚠️ Risks</p>
          <ul className="text-xs space-y-1">
            {result.risks.map((risk, idx) => (
              <li key={idx} className="text-gray-300">• {risk}</li>
            ))}
          </ul>
        </div>
      )}

      {result.next_actions.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 p-3">
          <p className="font-semibold text-blue-300 mb-2">🎯 Next Actions</p>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            {result.next_actions.map((action, idx) => (
              <li key={idx} className="text-gray-300">{action}</li>
            ))}
          </ol>
        </div>
      )}

      {result.follow_up_question && (
        <p className="text-purple-200 italic">{result.follow_up_question}</p>
      )}
    </div>
  );
}

function formatHeading(rawKey: string): string {
  return rawKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}
