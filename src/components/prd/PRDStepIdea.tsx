import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Wand2, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ContextPackage, ContextQuestion } from '../../types';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface PRDStepIdeaProps {
  idea: string;
  setIdea: (value: string) => void;
  questions: ContextQuestion[];
  onGenerateQuestions: () => void;
  isGeneratingQuestions: boolean;
  onGeneratePackage: (answers: Array<{ id: string; question: string; answer: string }>) => void;
  isGeneratingPackage: boolean;
  contextPackage: ContextPackage | null;
}

export function PRDStepIdea({
  idea,
  setIdea,
  questions,
  onGenerateQuestions,
  isGeneratingQuestions,
  onGeneratePackage,
  isGeneratingPackage,
  contextPackage,
}: PRDStepIdeaProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset answers when a fresh batch of questions arrives
    setAnswers({});
  }, [questions]);

  const answeredQuestions = useMemo(
    () =>
      questions.map((item) => ({
        id: item.id,
        question: item.question,
        answer: answers[item.id]?.trim() || '',
      })),
    [questions, answers]
  );

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleGeneratePackage = () => {
    onGeneratePackage(answeredQuestions);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Start with your idea</h2>
        <p className="text-gray-300 max-w-3xl">
          Describe what you want to build in plain language. We’ll ask a couple of smart follow-up questions, then turn everything into a complete context bundle for your AI assistant.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="space-y-3">
          <label className="text-sm font-medium text-white">What are you building?</label>
          <Textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="e.g., A recipe app where my family can share meal ideas and auto-generate shopping lists"
            className="min-h-[120px]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-300">
            The assistant uses your idea to craft a handful of clarifying questions. Answer only what you know—defaults are provided for everything else.
          </p>
          <Button
            type="button"
            onClick={onGenerateQuestions}
            disabled={!idea.trim() || isGeneratingQuestions}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500"
          >
            <Wand2 className="h-4 w-4" />
            {isGeneratingQuestions ? 'Thinking…' : 'Ask Quick Questions'}
          </Button>
        </div>

        {questions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-200">Clarify the essentials</h3>
            <div className="grid gap-4 lg:grid-cols-3">
              {questions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-2">
                  <p className="text-sm font-medium text-white">{item.question}</p>
                  {item.helper && <p className="text-xs text-gray-400">{item.helper}</p>}
                  <Textarea
                    value={answers[item.id] || ''}
                    onChange={(event) => handleAnswerChange(item.id, event.target.value)}
                    placeholder="Leave blank if you’re unsure—Nova will make a safe assumption."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-300">
                Ready? We’ll combine your idea, the answers above, and best practices into a set of context files your AI assistant can follow.
              </p>
              <Button
                type="button"
                onClick={handleGeneratePackage}
                disabled={!idea.trim() || isGeneratingPackage}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingPackage ? 'Preparing context…' : 'Generate Context Bundle'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {contextPackage && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 space-y-6">
            <header className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Context Bundle Ready</h3>
                  <p className="text-sm text-gray-300">Copy or download these files and feed them directly to your AI coding assistant.</p>
                </div>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed border border-white/10 rounded-2xl bg-white/5 p-4">
                {contextPackage.summary}
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <h4 className="text-lg font-semibold text-white">Quick facts</h4>
                <ul className="space-y-2 text-sm text-gray-200">
                  <li><strong className="text-white">Project:</strong> {contextPackage.projectName}</li>
                  <li><strong className="text-white">Type:</strong> {contextPackage.projectType}</li>
                  <li><strong className="text-white">Audience:</strong> {contextPackage.targetAudience}</li>
                </ul>
                <div>
                  <h5 className="text-sm font-semibold uppercase tracking-wide text-purple-200 mb-2">Assumptions</h5>
                  <ul className="space-y-1 text-sm text-gray-200">
                    {contextPackage.assumptions.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 space-y-3">
                <h4 className="text-lg font-semibold text-white">Key decisions</h4>
                <DecisionList label="Tech stack" items={contextPackage.decisions.techStack} />
                <DecisionList label="Integrations" items={contextPackage.decisions.integrations} />
                <DecisionList label="Quality focus" items={contextPackage.decisions.quality} />
                {contextPackage.decisions.notes && contextPackage.decisions.notes.length > 0 && (
                  <DecisionList label="Notes" items={contextPackage.decisions.notes} />
                )}
              </div>
            </div>

            {contextPackage.nextSteps.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
                <h4 className="text-lg font-semibold text-white">Suggested next moves</h4>
                <ol className="space-y-2 text-sm text-gray-200 list-decimal list-inside">
                  {contextPackage.nextSteps.map((step, index) => (
                    <li key={`${step}-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-300" />
                Context Files
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {contextPackage.files.map((file) => (
                  <article key={file.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-purple-200">{file.filename}</p>
                      <h5 className="text-lg font-semibold text-white">{file.title}</h5>
                    </div>
                    <p className="text-sm text-gray-300">{file.purpose}</p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 border-white/20 text-gray-200 hover:bg-white/10"
                        onClick={() => copyToClipboard(file.content)}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500"
                        onClick={() => downloadFile(file.filename, file.content)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {contextPackage.prompts.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Kickoff prompts for your AI assistant</h4>
                <div className="space-y-3">
                  {contextPackage.prompts.map((prompt, index) => (
                    <div key={`${prompt.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h5 className="text-md font-semibold text-white">{prompt.title}</h5>
                          <p className="text-xs text-gray-400">{prompt.instructions}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex items-center gap-2 border-white/20 text-gray-200 hover:bg-white/10"
                          onClick={() => copyToClipboard(prompt.prompt)}
                        >
                          <Copy className="h-4 w-4" />
                          Copy prompt
                        </Button>
                      </div>
                      <Textarea value={prompt.prompt} readOnly className="font-mono text-xs min-h-[120px]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

interface DecisionListProps {
  label: string;
  items: string[];
}

function DecisionList({ label, items }: DecisionListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
      <h5 className="text-sm font-semibold uppercase tracking-wide text-purple-200 mb-2">{label}</h5>
      <ul className="space-y-1 text-sm text-purple-100">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function copyToClipboard(content: string) {
  try {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  } catch (error) {
    console.error('Failed to copy to clipboard', error);
    toast.error('Could not copy to clipboard');
  }
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
