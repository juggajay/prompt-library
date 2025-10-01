import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useCreatePrompt } from '../../hooks/usePrompts';
import { CATEGORIES } from '../../types';

const promptSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  prompt_text: z.string().min(10, 'Prompt must be at least 10 characters').max(10000),
  description: z.string().max(500).optional(),
  category: z.enum(CATEGORIES),
  tags: z.string().optional(),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface CreatePromptFormProps {
  onClose: () => void;
}

export function CreatePromptForm({ onClose }: CreatePromptFormProps) {
  const createPrompt = useCreatePrompt();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      category: 'Other',
    },
  });

  const onSubmit = async (data: PromptFormData) => {
    const tags = data.tags
      ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    await createPrompt.mutateAsync({
      title: data.title,
      prompt_text: data.prompt_text,
      description: data.description,
      category: data.category,
      tags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Create New Prompt
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

          <Textarea
            {...register('prompt_text')}
            label="Prompt Text"
            placeholder="Enter your prompt here..."
            rows={8}
            error={errors.prompt_text?.message}
          />

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

          <Input
            {...register('tags')}
            label="Tags (Optional)"
            placeholder="e.g., marketing, social media, creative"
            error={errors.tags?.message}
          />
          <p className="text-xs text-gray-400">Separate tags with commas</p>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createPrompt.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
            >
              {createPrompt.isPending ? 'Creating...' : 'Create Prompt'}
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
