import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { MarkdownEditor } from '../ui/MarkdownEditor';
import { useUpdatePrompt } from '../../hooks/usePrompts';
import { useFolders } from '../../hooks/useFolders';
import { CATEGORIES, type Prompt } from '../../types';
import { isOpenAIConfigured } from '../../lib/openai';
import { processPromptWithAI } from '../../services/ai.service';
import { PromptImprovement } from './PromptImprovement';
import { useState } from 'react';
import { toast } from 'sonner';

const promptSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  prompt_text: z.string().min(10, 'Prompt must be at least 10 characters').max(10000),
  description: z.string().max(500).optional(),
  category: z.enum(CATEGORIES),
  tags: z.string().optional(),
  folder_id: z.string().optional(),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface EditPromptFormProps {
  prompt: Prompt;
  onClose: () => void;
}

export function EditPromptForm({ prompt, onClose }: EditPromptFormProps) {
  const updatePrompt = useUpdatePrompt();
  const { data: folders = [] } = useFolders();
  const [aiProcessing, setAiProcessing] = useState(false);
  const [useAutoCategorize, setUseAutoCategorize] = useState(false);
  const [useAutoTag, setUseAutoTag] = useState(false);
  const [useQualityScore, setUseQualityScore] = useState(false);
  const [showImprovement, setShowImprovement] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt.title,
      prompt_text: prompt.prompt_text,
      description: prompt.description || '',
      category: prompt.category,
      tags: prompt.tags.join(', '),
      folder_id: prompt.folder_id || '',
    },
  });

  const promptText = watch('prompt_text');
  const title = watch('title');

  const handleAIEnhance = async () => {
    if (!promptText || !title) {
      toast.error('Please enter a title and prompt text first');
      return;
    }

    setAiProcessing(true);
    try {
      const results = await processPromptWithAI(promptText, title, {
        autoCategorize: useAutoCategorize,
        autoTag: useAutoTag,
        scoreQuality: useQualityScore,
      });

      if (results.category && useAutoCategorize) {
        setValue('category', results.category.category);
        toast.success(`AI suggested category: ${results.category.category} (${Math.round(results.category.confidence * 100)}% confidence)`);
      }

      if (results.tags && useAutoTag) {
        const existingTags = watch('tags');
        const newTags = existingTags
          ? `${existingTags}, ${results.tags.tags.join(', ')}`
          : results.tags.tags.join(', ');
        setValue('tags', newTags);
        toast.success(`AI generated ${results.tags.tags.length} tags`);
      }

      if (results.quality && useQualityScore) {
        toast.success(`Quality Score: ${results.quality.score}/100`, {
          description: results.quality.feedback,
        });
      }
    } catch (error) {
      toast.error('AI processing failed. Please try again.');
      console.error(error);
    } finally {
      setAiProcessing(false);
    }
  };

  const onSubmit = async (data: PromptFormData) => {
    const tags = data.tags
      ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    await updatePrompt.mutateAsync({
      id: prompt.id,
      updates: {
        title: data.title,
        prompt_text: data.prompt_text,
        description: data.description,
        category: data.category,
        tags,
        folder_id: data.folder_id || undefined,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Edit Prompt
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            {...register('title')}
            label="Title"
            placeholder="e.g., Blog Post Generator"
            error={errors.title?.message}
          />

          <div>
            <MarkdownEditor
              value={promptText}
              onChange={(value) => setValue('prompt_text', value || '')}
              label="Prompt Text"
              placeholder="Enter your prompt here... (Markdown supported)"
              height={300}
              error={errors.prompt_text?.message}
            />
          </div>

          <Textarea
            {...register('description')}
            label="Description (Optional)"
            placeholder="Brief description of what this prompt does..."
            rows={3}
            error={errors.description?.message}
          />

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category} className="bg-slate-900 text-white">
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-2 text-sm text-red-400">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Folder (Optional)
            </label>
            <select
              {...register('folder_id')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              <option value="" className="bg-slate-900 text-white">
                No folder
              </option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id} className="bg-slate-900 text-white">
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            {...register('tags')}
            label="Tags (Optional)"
            placeholder="e.g., marketing, social media, creative"
            error={errors.tags?.message}
          />
          <p className="text-xs text-gray-400">Separate tags with commas</p>

          {/* Prompt Improvement Section */}
          {isOpenAIConfigured && promptText && promptText.length >= 10 && !showImprovement && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <button
                type="button"
                onClick={() => setShowImprovement(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2
                           bg-gradient-to-r from-purple-600 to-blue-600 text-white
                           rounded-lg font-medium hover:from-purple-700 hover:to-blue-700
                           transition-all shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Re-improve this prompt
              </button>
            </div>
          )}

          {/* Improvement Component */}
          {showImprovement && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <PromptImprovement
                originalPrompt={promptText}
                onAccept={(improvedPrompt) => {
                  setValue('prompt_text', improvedPrompt);
                  setShowImprovement(false);
                  toast.success('Prompt improved! Review and save when ready.');
                }}
                onReject={() => {
                  setShowImprovement(false);
                  toast.info('Kept original prompt');
                }}
              />
            </div>
          )}

          {/* AI Enhancement Section */}
          {isOpenAIConfigured && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-300 mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">AI Enhancement</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoCategorize}
                    onChange={(e) => setUseAutoCategorize(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  Auto-categorize prompt
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoTag}
                    onChange={(e) => setUseAutoTag(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  Generate AI tags
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useQualityScore}
                    onChange={(e) => setUseQualityScore(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  Analyze quality score
                </label>
              </div>

              <Button
                type="button"
                onClick={handleAIEnhance}
                disabled={aiProcessing || (!useAutoCategorize && !useAutoTag && !useQualityScore)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                {aiProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enhance with AI
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updatePrompt.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
            >
              {updatePrompt.isPending ? 'Updating...' : 'Update Prompt'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
