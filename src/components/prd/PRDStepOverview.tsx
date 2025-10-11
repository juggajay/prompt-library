import type { GeneratePRDParams, PRDTemplate, ProjectType } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

const PROJECT_TYPES: Array<{ value: ProjectType; label: string; helper: string }> = [
  { value: 'web_app', label: 'Web Application', helper: 'Browser-based product or dashboard' },
  { value: 'mobile_app', label: 'Mobile Application', helper: 'iOS / Android experience' },
  { value: 'api', label: 'API Service', helper: 'Backend service consumed by other apps' },
  { value: 'desktop_app', label: 'Desktop Application', helper: 'Windows, macOS, or Linux app' },
  { value: 'data_pipeline', label: 'Data Pipeline', helper: 'ETL, analytics, or automation workflow' },
  { value: 'ai_agent', label: 'AI Agent', helper: 'Autonomous or semi-autonomous assistant' },
  { value: 'other', label: 'Something Else', helper: 'Anything that doesn’t fit the buckets above' },
];

interface PRDStepOverviewProps {
  formData: Partial<GeneratePRDParams>;
  updateFormData: (updates: Partial<GeneratePRDParams>) => void;
  templates: PRDTemplate[];
  isLoadingTemplates: boolean;
  onTemplateSelect: (template: PRDTemplate) => void;
  selectedTemplateId: string | null;
}

export function PRDStepOverview({
  formData,
  updateFormData,
  templates,
  isLoadingTemplates,
  onTemplateSelect,
  selectedTemplateId,
}: PRDStepOverviewProps) {
  const projectType = formData.projectType || 'web_app';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div>
        <h2 className="text-2xl font-semibold text-white">Project Basics</h2>
          <p className="text-gray-300 mt-1">
            Fill in what you already know. Only the quick description is required—everything else is optional and can be refined later.
          </p>
        </div>

      <div className="space-y-5">
        <Input
          label="Project Name"
          placeholder="E.g. LaunchPad"
          value={formData.projectName || ''}
          onChange={(event) => updateFormData({ projectName: event.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-white mb-2">Project Type</label>
          <div className="grid gap-3 sm:grid-cols-2">
              {PROJECT_TYPES.map((type) => {
                const isActive = projectType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData({ projectType: type.value })}
                    className={`text-left rounded-xl border px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? 'border-purple-400 bg-purple-500/20 text-white shadow-lg shadow-purple-500/20'
                        : 'border-white/10 bg-white/5 text-gray-200 hover:border-purple-400/50 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-300 mt-1">{type.helper}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Quick Description"
            placeholder="What are you building and why? A few sentences are perfect."
            value={formData.description || ''}
            onChange={(event) => updateFormData({ description: event.target.value })}
            required
          />

          <Textarea
            label="Target Audience"
            placeholder="Who will use this? Mention the primary users in plain language."
            value={formData.targetAudience || ''}
            onChange={(event) => updateFormData({ targetAudience: event.target.value })}
          />

          <Input
            label="Timeline (optional)"
            placeholder="E.g. MVP in 6 weeks, full launch in 3 months"
            value={formData.timeline || ''}
            onChange={(event) => updateFormData({ timeline: event.target.value })}
          />
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-semibold text-white flex items-center justify-between">
            Jump-start with a template
            {isLoadingTemplates && <span className="text-xs text-gray-400">Loading…</span>}
          </h3>
          <p className="text-sm text-gray-300 mt-2">
            Pick a template that feels close. You can still adjust anything later.
          </p>

          <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <div
                  key={template.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500/20 shadow-inner shadow-purple-500/30'
                      : 'border-white/10 bg-slate-900/40 hover:border-purple-400/50 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{template.name}</p>
                      <p className="text-xs text-gray-300 mt-1">{template.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? 'secondary' : 'outline'}
                      onClick={() => onTemplateSelect(template)}
                    >
                      {isSelected ? 'Selected' : 'Use'}
                    </Button>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs uppercase text-gray-400">Sections included</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {template.structure.sections.slice(0, 6).map((section) => (
                        <span
                          key={section}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-200"
                        >
                          {section}
                        </span>
                      ))}
                      {template.structure.sections.length > 6 && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-400">
                          +{template.structure.sections.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && !isLoadingTemplates && (
              <p className="text-sm text-gray-400">
                No templates yet. You can create your own after generating your first PRD.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-fuchsia-500/10 p-5">
          <h3 className="text-lg font-semibold text-white">Helpful tip</h3>
          <p className="text-sm text-gray-200 mt-2 leading-relaxed">
            You don’t have to get everything perfect right now. The AI can fill in gaps and
            suggest improvements in the next step, so jot down whatever you know.
          </p>
        </div>
      </aside>
    </div>
  );
}
