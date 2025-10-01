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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create New Prompt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <Input
            {...register('tags')}
            label="Tags (Optional)"
            placeholder="e.g., marketing, social media, creative"
            error={errors.tags?.message}
          />
          <p className="text-xs text-gray-500">Separate tags with commas</p>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createPrompt.isPending}
              className="flex-1"
            >
              {createPrompt.isPending ? 'Creating...' : 'Create Prompt'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
