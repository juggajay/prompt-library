import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GeneratePRDParams, PRDDocument, PRDTemplate } from '../../types';
import { Button } from '../ui/Button';
import { PRDStepOverview } from './PRDStepOverview';
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
import { toast } from 'sonner';

const INITIAL_FORM: Partial<GeneratePRDParams> = {
  projectType: 'web_app',
  requirements: {
    functional: [],
    nonFunctional: [],
    technical: [],
  },
};

const STEPS = [
  { id: 'overview', title: 'Project Basics', description: 'Name, type, and audience' },
  { id: 'requirements', title: 'Requirements', description: 'Functional and technical notes' },
  { id: 'ai', title: 'AI Generation', description: 'Generate your PRD with AI' },
  { id: 'optimize', title: 'Review & Improve', description: 'Chat with Nova to refine your PRD' },
  { id: 'preview', title: 'Preview & Export', description: 'Review, download, and share' },
] as const;

export function PRDGeneratorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<GeneratePRDParams>>(INITIAL_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<PRDDocument | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const templatesQuery = usePRDTemplates();
  const documentsQuery = usePRDDocuments();
  const generateMutation = useGeneratePRD();
  const optimizeMutation = useOptimizePRD();
  const exportMutation = useExportPRD();
  const deleteMutation = useDeletePRD();
  const updateMutation = useUpdatePRD();

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

  const updateFormData = (updates: Partial<GeneratePRDParams>) => {
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

  const handleTemplateSelect = (template: PRDTemplate) => {
    setSelectedTemplateId(template.id);
    updateFormData({
      projectType: template.project_type,
      templateId: template.id.startsWith('default-') ? undefined : template.id,
    });
  };

  const handleGenerate = async () => {
    const requiredFields: Array<keyof GeneratePRDParams> = [
      'projectName',
      'projectType',
      'description',
      'targetAudience',
    ];

    const missing = requiredFields.filter((field) => {
      const value = formData[field];
      return !value || (typeof value === 'string' && value.trim().length === 0);
    });

    if (missing.length > 0) {
      toast.error('Let’s fill in the basics before generating.');
      setCurrentStep(0);
      return;
    }

    const requirements = formData.requirements || {
      functional: [],
      nonFunctional: [],
      technical: [],
    };

    const payload: GeneratePRDParams = {
      projectName: formData.projectName!.trim(),
      projectType: formData.projectType!,
      description: formData.description!.trim(),
      targetAudience: formData.targetAudience!.trim(),
      requirements,
      timeline: formData.timeline?.trim() || undefined,
      promptId: formData.promptId,
      templateId: formData.templateId,
    };

    try {
      const result = await generateMutation.mutateAsync(payload);
      setGeneratedDocument(result.document);
      setSelectedDocumentId(result.document.id);
      setCurrentStep(3); // Move to optimize step
    } catch {
      // Error handled by mutation toast
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
      goal: formData.description,
      targetAudience: formData.targetAudience,
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
      // toast handled
    }
  };

  const handleSave = async (documentId: string, content: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({ id: documentId, updates: { content } });
    } catch {
      // toast handled
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goNext = () => {
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
          <PRDStepOverview
            formData={formData}
            updateFormData={updateFormData}
            templates={templates}
            isLoadingTemplates={templatesQuery.isLoading}
            onTemplateSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplateId}
          />
        )}
        {currentStep === 1 && (
          <PRDStepRequirements formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
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
        {currentStep === 3 && (
          <PRDStepOptimize
            generatedDocument={generatedDocument}
            onOptimize={handleOptimize}
            isOptimizing={optimizeMutation.isPending}
          />
        )}
        {currentStep === 4 && (
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
