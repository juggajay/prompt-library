import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { PRDStepArchitecture } from '../components/prd/PRDStepArchitecture';
import { PRDStepTasks } from '../components/prd/PRDStepTasks';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useGenerateBlueprint, useGenerateTasks, useSaveCLITasks } from '../hooks/useBlueprint';
import type {
  BlueprintResponse,
  CLITaskResponse,
  CreateBlueprintPayload,
  GeneratePRDParams,
  GenerateTasksPayload,
} from '../types';
import {
  loadContextPackage,
  loadBlueprintSnapshot,
  loadTasksSnapshot,
  saveBlueprintSnapshot,
  saveTasksSnapshot,
  clearTasksSnapshot,
} from '../lib/assistantStorage';
import { toast } from 'sonner';

type PlannerFormData = Partial<GeneratePRDParams> & {
  goals?: string[];
  constraints?: string[];
};

const INITIAL_FORM: PlannerFormData = {
  projectType: 'web_app',
  requirements: {
    functional: [],
    nonFunctional: [],
    technical: [],
  },
  goals: [],
  constraints: [],
};

export function ArchitecturePlanner() {
  const [formData, setFormData] = useState<PlannerFormData>(INITIAL_FORM);
  const [blueprint, setBlueprint] = useState<BlueprintResponse | null>(null);
  const [cliTasks, setCliTasks] = useState<CLITaskResponse | null>(null);

  const blueprintMutation = useGenerateBlueprint();
  const tasksMutation = useGenerateTasks();
  const saveTasksMutation = useSaveCLITasks();

  useEffect(() => {
    const context = loadContextPackage();
    if (context) {
      setFormData((prev) => ({
        ...prev,
        projectName: context.projectName,
        description: context.summary,
        projectType: normalizeProjectType(context.projectType),
        targetAudience: context.targetAudience,
        goals: context.nextSteps.slice(0, 3),
      }));
    }

    const storedBlueprint = loadBlueprintSnapshot();
    if (storedBlueprint) {
      setBlueprint(storedBlueprint);
    }

    const storedTasks = loadTasksSnapshot();
    if (storedTasks) {
      setCliTasks(storedTasks);
    }
  }, []);

  const updateFormData = (updates: Partial<GeneratePRDParams> & { goals?: string[]; constraints?: string[] }) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        ...updates,
      };

      if (!next.requirements) {
        next.requirements = { functional: [], nonFunctional: [], technical: [] };
      }

      return next;
    });
  };

  const handleGenerateBlueprint = async (payload: CreateBlueprintPayload) => {
    try {
      const result = await blueprintMutation.mutateAsync(payload);
      setBlueprint(result);
      saveBlueprintSnapshot(result);
      setCliTasks(null);
      clearTasksSnapshot();
    } catch {
      // handled in hook
    }
  };

  const handleGenerateTasks = async (payload: GenerateTasksPayload) => {
    try {
      const result = await tasksMutation.mutateAsync(payload);
      setCliTasks(result);
      if (result.tasks?.length) {
        saveTasksSnapshot(result);
      }

      const blueprintId = blueprint?.blueprintId;
      if (blueprintId && result.tasks?.length) {
        await saveTasksMutation.mutateAsync({ blueprintId, tasks: result.tasks });
      }
    } catch {
      // handled in hook
    }
  };

  const handleCopyAdvice = () => {
    toast.info('Tips: Copy any file or prompt blocks directly into your AI assistant.');
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-purple-300">Project Assistant</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Architecture & Task Planner
          </h1>
          <p className="text-gray-300 max-w-3xl">
            Turn your idea into a clear plan. Generate architecture notes and a CLI-friendly task list you can drop straight into Claude, Cursor, or CMD Copilot.
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Project snapshot</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Project name"
              value={formData.projectName || ''}
              onChange={(event) => updateFormData({ projectName: event.target.value })}
              placeholder="Untitled Project"
            />
            <Input
              label="Primary audience"
              value={formData.targetAudience || ''}
              onChange={(event) => updateFormData({ targetAudience: event.target.value })}
              placeholder="General audience"
            />
          </div>
          <Textarea
            label="One-line summary"
            value={formData.description || ''}
            onChange={(event) => updateFormData({ description: event.target.value })}
            placeholder="Brief description to keep AI grounded"
          />
        </div>

        <PRDStepArchitecture
          formData={formData}
          updateFormData={updateFormData}
          onGenerate={handleGenerateBlueprint}
          blueprint={blueprint}
          isGenerating={blueprintMutation.isPending}
        />

        <PRDStepTasks
          formData={formData}
          blueprintSummary={blueprint?.architecture.summary || null}
          onGenerate={handleGenerateTasks}
          tasks={cliTasks}
          isGenerating={tasksMutation.isPending}
        />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
          <p>
            Once you’re happy with the plan, head to the PRD generator to turn these decisions into a polished document. Need a reminder? {''}
            <button onClick={handleCopyAdvice} className="text-purple-200 underline hover:text-white">
              Tips for working with AI copilots
            </button>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function normalizeProjectType(value: string | undefined): PlannerFormData['projectType'] {
  if (!value) return 'other';
  const normalized = value.toLowerCase();
  if (['web', 'web_app', 'webapp', 'frontend'].includes(normalized)) return 'web_app';
  if (['mobile', 'mobile_app', 'ios', 'android'].includes(normalized)) return 'mobile_app';
  if (['api', 'backend', 'service'].includes(normalized)) return 'api';
  if (['desktop', 'desktop_app', 'electron'].includes(normalized)) return 'desktop_app';
  if (['data', 'data_pipeline', 'analytics', 'etl'].includes(normalized)) return 'data_pipeline';
  if (['agent', 'ai', 'ai_agent'].includes(normalized)) return 'ai_agent';
  return 'other';
}
