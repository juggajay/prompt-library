import type { CLITaskResponse, GenerateTasksPayload, GeneratePRDParams } from '../../types';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface PRDStepTasksProps {
  formData: Partial<GeneratePRDParams> & {
    goals?: string[];
  };
  blueprintSummary: string | null;
  onGenerate: (payload: GenerateTasksPayload) => void;
  tasks: CLITaskResponse | null;
  isGenerating: boolean;
}

export function PRDStepTasks({
  formData,
  blueprintSummary,
  onGenerate,
  tasks,
  isGenerating,
}: PRDStepTasksProps) {
  const goals = formData.goals || [];
  const hasDescription = Boolean(formData.description?.trim());
  const canGenerate = Boolean(blueprintSummary) && hasDescription;

  const handleGenerate = () => {
    if (!canGenerate || !blueprintSummary) {
      return;
    }

    onGenerate({
      projectName: formData.projectName?.trim() || 'Untitled Project',
      projectType: formData.projectType || 'other',
      description: formData.description?.trim() || 'A new project',
      architectureSummary: blueprintSummary,
      goals,
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">CLI Task Plan</h2>
        <p className="text-gray-300 max-w-3xl">
          Turn your blueprint into a lightweight task list with CLI-ready prompts. Each item is designed for tools like Claude Code and Codex.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-300">
            The generator considers your goals, description, and architecture overview to craft 6–8 focused tasks.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500"
          >
            {isGenerating ? 'Preparing tasks…' : 'Generate Task Plan'}
          </Button>
        </div>
        {!blueprintSummary && (
          <p className="text-sm text-amber-200">
            Generate the architecture blueprint first so the AI knows how the project is structured.
          </p>
        )}
        {blueprintSummary && !hasDescription && (
          <p className="text-sm text-amber-200">
            Add a quick project description so the task plan has something to build from.
          </p>
        )}
      </section>

      {tasks && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 space-y-6">
            <header>
              <h3 className="text-xl font-semibold text-white">Plan Overview</h3>
              <p className="text-sm text-gray-300 mt-2">{tasks.summary}</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
              {(tasks.tasks ?? []).map((task) => (
                <article key={task.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">{task.title}</h4>
                    <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs uppercase tracking-wide text-purple-100">
                      {task.effort}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{task.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span key={`${task.title}-${tag}`} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Prompt</p>
                    <Textarea value={task.cliPrompt} readOnly className="mt-2 min-h-[90px] text-xs font-mono" />
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 space-y-2">
              <h4 className="text-lg font-semibold text-white">Tips from Nova</h4>
              <ul className="space-y-1 text-sm text-purple-100">
                {(tasks.recommendations ?? []).map((tip, index) => (
                  <li key={`${tip}-${index}`} className="flex gap-2">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
