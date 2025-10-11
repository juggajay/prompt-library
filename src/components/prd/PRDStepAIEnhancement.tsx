import { CheckCircle, Sparkles } from 'lucide-react';
import type { GeneratePRDParams } from '../../types';
import { Button } from '../ui/Button';

interface PRDStepAIEnhancementProps {
  formData: Partial<GeneratePRDParams>;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedTemplateName?: string | null;
}

const REQUIRED_FIELDS: Array<keyof GeneratePRDParams> = [
  'projectName',
  'projectType',
  'description',
  'targetAudience',
];

export function PRDStepAIEnhancement({
  formData,
  onGenerate,
  isGenerating,
  selectedTemplateName,
}: PRDStepAIEnhancementProps) {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = formData[field];
    return !value || (typeof value === 'string' && value.trim().length === 0);
  });

  const requirementStats = {
    functional: formData.requirements?.functional?.length ?? 0,
    nonFunctional: formData.requirements?.nonFunctional?.length ?? 0,
    technical: formData.requirements?.technical?.length ?? 0,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-300" />
            Ready for AI polishing
          </h2>
          <p className="text-gray-300 mt-1">
            We’ll turn your notes into a structured PRD with goals, metrics, timeline tips, and
            risks. Double-check the checklist below before you hit generate.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-1" />
            <div>
              <p className="font-medium text-white">Template in play</p>
              <p className="text-sm text-gray-300">
                {selectedTemplateName
                  ? `Using the “${selectedTemplateName}” outline. You can switch templates anytime.`
                  : 'Using the base outline. Pick a template earlier if you prefer a tailored structure.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle
              className={`h-5 w-5 mt-1 ${
                missingFields.length === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <div>
              <p className="font-medium text-white">Key details captured</p>
              {missingFields.length === 0 ? (
                <p className="text-sm text-gray-300">
                  All core fields are filled. Great! The AI has enough context to build something
                  helpful.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-amber-200">
                  <li>Before generating, add info for:</li>
                  {missingFields.map((field) => (
                    <li key={field} className="ml-4 list-disc">
                      {humanize(field)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-1" />
            <div>
              <p className="font-medium text-white">Requirements entered</p>
              <p className="text-sm text-gray-300">
                Functional ({requirementStats.functional}), Non-functional ({requirementStats.nonFunctional}),
                Technical ({requirementStats.technical}). Even one or two bullet points are plenty to start.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-6 text-sm text-purple-100">
          <p className="leading-relaxed">
            Tip: If you’re unsure about a section, just leave it blank. The AI will suggest beginner-friendly
            ideas and mark anything that still needs your input.
          </p>
        </div>

        <Button
          onClick={onGenerate}
          disabled={isGenerating || missingFields.length > 0}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/40"
        >
          {isGenerating ? 'Generating your PRD…' : 'Generate my PRD'}
        </Button>
      </div>

      <aside className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">What happens next?</h3>
        <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
          <li>
            The AI drafts every PRD section with supportive language geared towards solo builders and small teams.
          </li>
          <li>
            You’ll get a preview you can tweak. Save changes anytime—each version stays in your history.
          </li>
          <li>
            Export as Markdown, PDF, or DOCX when you’re happy with it.
          </li>
        </ol>
      </aside>
    </div>
  );
}

function humanize(key: keyof GeneratePRDParams): string {
  switch (key) {
    case 'projectName':
      return 'Project name';
    case 'projectType':
      return 'Project type';
    case 'description':
      return 'Project description';
    case 'targetAudience':
      return 'Target audience';
    default:
      return key;
  }
}
