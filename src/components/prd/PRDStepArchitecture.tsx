import { useState } from 'react';
import type { BlueprintResponse, CreateBlueprintPayload, GeneratePRDParams } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface PRDStepArchitectureProps {
  formData: Partial<GeneratePRDParams> & {
    goals?: string[];
    constraints?: string[];
  };
  updateFormData: (updates: Partial<GeneratePRDParams> & { goals?: string[]; constraints?: string[] }) => void;
  onGenerate: (payload: CreateBlueprintPayload) => void;
  blueprint: BlueprintResponse | null;
  isGenerating: boolean;
}

export function PRDStepArchitecture({
  formData,
  updateFormData,
  onGenerate,
  blueprint,
  isGenerating,
}: PRDStepArchitectureProps) {
  const [goalDraft, setGoalDraft] = useState('');
  const [constraintDraft, setConstraintDraft] = useState('');
  const goals = formData.goals || [];
  const constraints = formData.constraints || [];

  const handleGenerate = () => {
    // Use defaults for missing fields
    const projectName = formData.projectName?.trim() || 'Untitled Project';
    const projectType = formData.projectType?.trim() || 'web_app';
    const description = formData.description?.trim() || 'A new project';
    const targetAudience = formData.targetAudience?.trim() || 'General users';

    onGenerate({
      projectName,
      projectType,
      description,
      targetAudience,
      goals,
      constraints,
    });
  };

  const addGoal = () => {
    const trimmed = goalDraft.trim();
    if (!trimmed) return;
    updateFormData({ goals: [...goals, trimmed] });
    setGoalDraft('');
  };

  const addConstraint = () => {
    const trimmed = constraintDraft.trim();
    if (!trimmed) return;
    updateFormData({ constraints: [...constraints, trimmed] });
    setConstraintDraft('');
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Architecture Blueprint</h2>
        <p className="text-gray-300 max-w-3xl">
          Capture goals and constraints, then let Nova sketch a high-level architecture with recommended tools, components, and next steps.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Input
                  label="Project goal"
                  placeholder="Launch MVP with core onboarding flow"
                  value={goalDraft}
                  onChange={(event) => setGoalDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addGoal();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addGoal} className="self-end md:self-auto">
                Add Goal
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {goals.length === 0 && <p className="text-sm text-gray-400">No goals added yet.</p>}
              {goals.map((goal, index) => (
                <span
                  key={`${goal}-${index}`}
                  className="rounded-full bg-purple-500/20 px-4 py-1 text-sm text-purple-100 border border-purple-500/30"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Input
                  label="Constraints (optional)"
                  placeholder="Must use Supabase + Vercel"
                  value={constraintDraft}
                  onChange={(event) => setConstraintDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addConstraint();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={addConstraint} className="self-end md:self-auto">
                Add Constraint
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {constraints.length === 0 && <p className="text-sm text-gray-400">No constraints added yet.</p>}
              {constraints.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full bg-white/10 px-4 py-1 text-sm text-gray-200 border border-white/20"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 h-12"
          >
            {isGenerating ? 'Drafting architecture...' : 'Generate Architecture Blueprint'}
          </Button>
        </div>

        <aside className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 space-y-4 text-sm text-purple-50">
          <h3 className="text-lg font-semibold text-white">Tips for better results</h3>
          <ul className="space-y-3">
            <li>• Include at least one concrete goal (e.g., “Ship onboarding within 2 weeks”).</li>
            <li>• Call out hard requirements like tech stack, deploy targets, or team size.</li>
            <li>• If you’re unsure, leave a section blank—Nova will suggest safe defaults.</li>
          </ul>
        </aside>
      </section>

      {blueprint && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 space-y-6">
            <header>
              <h3 className="text-xl font-semibold text-white">Architecture Summary</h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{blueprint.architecture?.summary}</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 className="text-lg font-semibold text-white mb-4">Core Components</h4>
                <ul className="space-y-3 text-sm text-gray-200">
                  {(blueprint.architecture?.components ?? []).map((component) => (
                    <li key={component.name} className="rounded-xl bg-slate-900/60 p-4 border border-white/10">
                      <p className="text-white font-medium">{component.name}</p>
                      <p className="mt-1 text-gray-300">{component.responsibility}</p>
                      {component.notes && <p className="mt-2 text-xs text-gray-400">{component.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Recommended Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {(blueprint.architecture?.techStack ?? []).map((item) => (
                      <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-gray-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Data Flow</h4>
                  <ol className="space-y-2 text-sm text-gray-200 list-decimal list-inside">
                    {(blueprint.architecture?.dataFlow ?? []).map((step) => (
                      <li key={step.step}>
                        <span className="font-medium text-white">{step.step}:</span> {step.detail}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 space-y-3">
                <h4 className="text-lg font-semibold text-white">Next Steps</h4>
                <ul className="space-y-2 text-sm text-purple-100">
                  {(blueprint.nextSteps ?? []).map((step, index) => (
                    <li key={`${step}-${index}`} className="flex gap-2">
                      <span>•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <h4 className="text-lg font-semibold text-white">CLI Prompt Starters</h4>
                <ul className="space-y-3 text-sm text-gray-200">
                  {(blueprint.cliPrompts ?? []).map((prompt) => (
                    <li key={prompt.label} className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
                      <p className="font-medium text-white">{prompt.label}</p>
                      <Textarea
                        value={prompt.command}
                        readOnly
                        className="mt-2 min-h-[80px] text-xs font-mono"
                      />
                      {prompt.notes && <p className="mt-2 text-xs text-gray-400">{prompt.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
