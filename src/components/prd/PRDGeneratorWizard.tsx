import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  BlueprintResponse,
  CLITaskResponse,
  CreateBlueprintPayload,
  GenerateTasksPayload,
  GeneratePRDParams,
  PRDDocument,
  PRDTemplate,
  ContextPackage,
  ContextQuestion,
} from '../../types';
import { Button } from '../ui/Button';
import { PRDStepIdea } from './PRDStepIdea';
import { PRDStepOverview } from './PRDStepOverview';
import { PRDStepArchitecture } from './PRDStepArchitecture';
import { PRDStepTasks } from './PRDStepTasks';
import { PRDStepRequirements } from './PRDStepRequirements';
import { PRDStepAIEnhancement } from './PRDStepAIEnhancement';
import { PRDStepOptimize } from './PRDStepOptimize';
import { PRDStepPreview } from './PRDStepPreview';
import {
  useDeletePRD,
  useExportPRD,
  useGeneratePRD,
  useOptimizePRD,
  usePRDDocuments,
  usePRDTemplates,
  useUpdatePRD,
} from '../../hooks/usePRDGenerator';
import { useGenerateBlueprint, useGenerateTasks, useSaveCLITasks } from '../../hooks/useBlueprint';
import { useContextPackage, useContextQuestions } from '../../hooks/useContextAssistant';
import { toast } from 'sonner';

type WizardFormData = Partial<GeneratePRDParams> & {
  goals?: string[];
  constraints?: string[];
};

const INITIAL_FORM: WizardFormData = {
  projectType: 'web_app',
  requirements: {
    functional: [],
    nonFunctional: [],
    technical: [],
  },
  goals: [],
  constraints: [],
};

const STEPS = [
  { id: 'idea', title: 'Project Idea', description: 'Clarify your vision and assumptions' },
  { id: 'overview', title: 'Project Basics', description: 'Name, type, and audience' },
  { id: 'architecture', title: 'Architecture Blueprint', description: 'High-level system plan' },
  { id: 'cli-tasks', title: 'CLI Task Plan', description: 'Copy-ready prompts for copilots' },
  { id: 'requirements', title: 'Requirements', description: 'Functional and technical notes' },
  { id: 'ai', title: 'AI Generation', description: 'Generate your PRD with AI' },
  { id: 'optimize', title: 'Review & Improve', description: 'Chat with Nova to refine your PRD' },
  { id: 'preview', title: 'Preview & Export', description: 'Review, download, and share' },
] as const;

export function PRDGeneratorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [projectIdea, setProjectIdea] = useState('');
  const [contextQuestions, setContextQuestions] = useState<ContextQuestion[]>([]);
  const [contextPackage, setContextPackage] = useState<ContextPackage | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintResponse | null>(null);
  const [cliTasks, setCliTasks] = useState<CLITaskResponse | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<PRDDocument | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const templatesQuery = usePRDTemplates();
  const documentsQuery = usePRDDocuments();
  const generateMutation = useGeneratePRD();
  const optimizeMutation = useOptimizePRD();
  const exportMutation = useExportPRD();
  const deleteMutation = useDeletePRD();
  const updateMutation = useUpdatePRD();
  const blueprintMutation = useGenerateBlueprint();
  const tasksMutation = useGenerateTasks();
  const saveTasksMutation = useSaveCLITasks();
  const contextQuestionsMutation = useContextQuestions();
  const contextPackageMutation = useContextPackage();

  const templates = templatesQuery.data?.templates ?? [];
  const documents = documentsQuery.data ?? [];

  useEffect(() => {
    if (!selectedDocumentId && (documents?.length ?? 0) > 0) {
      setSelectedDocumentId(documents[0].id);
    }
  }, [documents, selectedDocumentId]);

  const mergedDocuments = useMemo(() => {
    const list = [...documents];
    if (generatedDocument && !list.some((doc) => doc.id === generatedDocument.id)) {
      list.unshift(generatedDocument);
    }
    return list;
  }, [documents, generatedDocument]);

  const selectedDocument =
    mergedDocuments.find((doc) => doc.id === selectedDocumentId) || generatedDocument || null;

  const updateFormData = (updates: Partial<GeneratePRDParams> & { goals?: string[]; constraints?: string[] }) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        ...updates,
      };

      if (!next.requirements) {
        next.requirements = { functional: [], nonFunctional: [], technical: [] };
      }

      if (!next.goals) {
        next.goals = [];
      }

      if (!next.constraints) {
        next.constraints = [];
      }

      return next;
    });
  };

  const handleTemplateSelect = (template: PRDTemplate) => {
    setSelectedTemplateId(template.id);
    updateFormData({
      projectType: template.project_type,
      templateId: template.id.startsWith('default-') ? undefined : template.id,
    });
  };

  const handleGenerateQuestions = async () => {
    const ideaText = projectIdea.trim();
    if (!ideaText) return;

    try {
      const questions = await contextQuestionsMutation.mutateAsync(ideaText);
      setContextQuestions(questions);
      setContextPackage(null);
    } catch {
      // handled by toast in hook
    }
  };

  const handleGenerateContextPackage = async (
    entries: Array<{ id: string; question: string; answer: string }>
  ) => {
    const ideaText = projectIdea.trim();
    if (!ideaText) return;

    try {
      const result = await contextPackageMutation.mutateAsync({
        idea: ideaText,
        answers: entries.filter((item) => item.answer.trim().length > 0),
      });

      setContextPackage(result);

      setBlueprint(null);
      setCliTasks(null);
      setGeneratedDocument(null);
      setSelectedDocumentId(null);

      updateFormData({
        description: result.summary || ideaText,
        projectName: result.projectName,
        projectType: normalizeProjectType(result.projectType),
        targetAudience: result.targetAudience,
        goals: (result.nextSteps || []).slice(0, 3),
      });
    } catch {
      // handled by toast in hook
    }
  };

  const handleGenerateBlueprint = async (payload: CreateBlueprintPayload) => {
    try {
      const result = await blueprintMutation.mutateAsync(payload);
      setBlueprint(result);
      setCliTasks(null);
    } catch {
      // handled inside mutation
    }
  };

  const handleGenerateTasksPlan = async (payload: GenerateTasksPayload) => {
    try {
      const result = await tasksMutation.mutateAsync(payload);
      setCliTasks(result);
      const blueprintId = blueprint?.blueprintId;
      if (blueprintId && result.tasks?.length) {
        await saveTasksMutation.mutateAsync({ blueprintId, tasks: result.tasks });
      }
    } catch {
      // handled inside mutation
    }
  };

  const handleGenerate = async () => {
    const description = formData.description?.trim();

    if (!description) {
      toast.error('Add a quick project description so the PRD has context.');
      setCurrentStep(0);
      return;
    }

    if (!blueprint) {
      toast.error('Generate your architecture blueprint before creating the PRD.');
      setCurrentStep(2);
      return;
    }

    const requirements = formData.requirements || {
      functional: [],
      nonFunctional: [],
      technical: [],
    };

    const payload: GeneratePRDParams = {
      projectName: formData.projectName?.trim() || 'Untitled Project',
      projectType: formData.projectType || 'other',
      description,
      targetAudience: formData.targetAudience?.trim() || 'General audience',
      requirements,
      timeline: formData.timeline?.trim() || undefined,
      promptId: formData.promptId,
      templateId: formData.templateId,
    };

    try {
      const result = await generateMutation.mutateAsync(payload);
      setGeneratedDocument(result.document);
      setSelectedDocumentId(result.document.id);
      setCurrentStep(6);
    } catch {
      // handled inside mutation
    }
  };

  const handleOptimize = async (
    message: string,
    history: Array<{ role: string; content: string; result?: any }>
  ) => {
    if (!generatedDocument) {
      throw new Error('No document to optimize');
    }

    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.role === 'assistant' && msg.result ? msg.result.summary : msg.content,
    }));

    const sessionContext = {
      goal: formData.description?.trim() || 'Project description pending',
      targetAudience: formData.targetAudience?.trim() || 'General audience',
      stage: 'draft',
    };

    const result = await optimizeMutation.mutateAsync({
      prdContent: generatedDocument.content,
      conversationHistory,
      userMessage: message,
      sessionContext,
    });

    return result.result;
  };

  const handleExport = async (documentId: string, format: 'markdown' | 'pdf' | 'docx') => {
    try {
      const blob = await exportMutation.mutateAsync({ documentId, format });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const doc = mergedDocuments.find((item) => item.id === documentId);
      const baseName = doc?.project_name ? slugify(doc.project_name) : 'prd';
      const extension = format === 'markdown' ? 'md' : format;
      link.href = url;
      link.download = `${baseName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // handled in mutation
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Delete this PRD? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(documentId);
      if (generatedDocument?.id === documentId) {
        setGeneratedDocument(null);
      }
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(null);
      }
    } catch {
      // handled in mutation
    }
  };

  const handleSave = async (documentId: string, content: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({ id: documentId, updates: { content } });
    } catch {
      // handled in mutation
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const ideaReady = projectIdea.trim().length > 0;
  const contextReady = !!contextPackage;
  const blueprintReady = !!blueprint;
  const tasksReady = !!cliTasks;
  const prdReady = !!generatedDocument;

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return ideaReady && contextReady;
      case 1:
        return ideaReady; // overview step just mirrors idea data
      case 2:
        return blueprintReady;
      case 3:
        return tasksReady;
      case 4:
        return true;
      case 5:
        return prdReady;
      case 6:
        return prdReady;
      default:
        return true;
    }
  };

  const disableNext = currentStep < STEPS.length - 1 && !isStepComplete(currentStep);

  const goNext = () => {
    if (disableNext) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-purple-500/20">
      <div className="h-2 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-purple-300">PRD Generator</p>
            <h1 className="text-2xl font-semibold text-white">{STEPS[currentStep].title}</h1>
            <p className="text-sm text-gray-300">{STEPS[currentStep].description}</p>
          </div>
          <div className="flex items-center gap-3">
            {STEPS.map((step, index) => {
              const isComplete = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-all ${
                      isActive
                        ? 'border-purple-400 bg-purple-500/30 text-white shadow-lg shadow-purple-500/40'
                        : isComplete
                        ? 'border-green-400 bg-green-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-gray-200'
                    }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="hidden h-px w-12 bg-white/10 md:block" />
                  )}
                </div>
              );
            })}
          </div>
      </div>
    </div>

      <div className="px-6 py-8">
        {currentStep === 0 && (
          <PRDStepIdea
            idea={projectIdea}
            setIdea={(value) => {
              setProjectIdea(value);
              if (!value.trim()) {
                setContextPackage(null);
                setContextQuestions([]);
              }
            }}
            questions={contextQuestions}
            onGenerateQuestions={handleGenerateQuestions}
            isGeneratingQuestions={contextQuestionsMutation.isPending}
            onGeneratePackage={handleGenerateContextPackage}
            isGeneratingPackage={contextPackageMutation.isPending}
            contextPackage={contextPackage}
          />
        )}

        {currentStep === 1 && (
          <PRDStepOverview
            formData={formData}
            updateFormData={updateFormData}
            templates={templates}
            isLoadingTemplates={templatesQuery.isLoading}
            onTemplateSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplateId}
          />
        )}

        {currentStep === 2 && (
          <PRDStepArchitecture
            formData={formData}
            updateFormData={updateFormData}
            onGenerate={handleGenerateBlueprint}
            blueprint={blueprint}
            isGenerating={blueprintMutation.isPending}
          />
        )}

        {currentStep === 3 && (
          <PRDStepTasks
            formData={formData}
            blueprintSummary={blueprint?.architecture.summary || null}
            onGenerate={handleGenerateTasksPlan}
            tasks={cliTasks}
            isGenerating={tasksMutation.isPending}
          />
        )}

        {currentStep === 4 && (
          <PRDStepRequirements formData={formData} updateFormData={updateFormData} />
        )}

        {currentStep === 5 && (
          <PRDStepAIEnhancement
            formData={formData}
            onGenerate={handleGenerate}
            isGenerating={generateMutation.isPending}
            selectedTemplateName={
              selectedTemplateId
                ? templates.find((template) => template.id === selectedTemplateId)?.name || null
                : null
            }
          />
        )}

        {currentStep === 6 && (
          <PRDStepOptimize
            generatedDocument={generatedDocument}
            onOptimize={handleOptimize}
            isOptimizing={optimizeMutation.isPending}
          />
        )}

        {currentStep === 7 && (
          <PRDStepPreview
            selectedDocument={selectedDocument}
            generatedDocument={generatedDocument}
            documents={mergedDocuments}
            onSelectDocument={(document) => setSelectedDocumentId(document.id)}
            onExport={handleExport}
            isExporting={exportMutation.isPending}
            onDeleteDocument={handleDelete}
            onSaveDocument={handleSave}
            isSaving={updateMutation.isPending}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/40 px-6 py-4">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 border-white/20 text-gray-200 hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {currentStep < STEPS.length - 1 && (
          <Button
            onClick={goNext}
            disabled={disableNext}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60) || 'prd';
}

function normalizeProjectType(value: string | undefined): WizardFormData['projectType'] {
  if (!value) return 'other';
  const normalized = value.toLowerCase();
  if (['web', 'web_app', 'web-app', 'webapp', 'frontend'].includes(normalized)) return 'web_app';
  if (['mobile', 'mobile_app', 'mobile-app', 'ios', 'android'].includes(normalized)) return 'mobile_app';
  if (['api', 'backend', 'service', 'microservice'].includes(normalized)) return 'api';
  if (['desktop', 'desktop_app', 'electron'].includes(normalized)) return 'desktop_app';
  if (['data', 'data_pipeline', 'analytics', 'etl'].includes(normalized)) return 'data_pipeline';
  if (['agent', 'ai', 'ai_agent', 'assistant'].includes(normalized)) return 'ai_agent';
  return 'other';
}
