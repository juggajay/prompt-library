import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PromptImprovement } from './PromptImprovement';
import { useUpdatePrompt } from '../../hooks/usePrompts';
import { toast } from 'sonner';

interface ImprovePromptButtonProps {
  promptId: string;
  promptText: string;
  onPromptUpdated?: (newText: string) => void;
  onShowChange?: (showing: boolean) => void;
}

export function ImprovePromptButton({
  promptId,
  promptText,
  onPromptUpdated,
  onShowChange
}: ImprovePromptButtonProps) {
  const [showImprovement, setShowImprovement] = useState(false);
  const updatePrompt = useUpdatePrompt();

  const handleShowChange = (show: boolean) => {
    setShowImprovement(show);
    onShowChange?.(show);
  };

  const handleAccept = async (improvedPrompt: string, improvementId?: string) => {
    try {
      // Update the prompt in the database
      await updatePrompt.mutateAsync({
        id: promptId,
        updates: {
          prompt_text: improvedPrompt,
          was_improved: true,
          original_version: promptText,
          improvement_history: [
            {
              timestamp: new Date().toISOString(),
              improvement_id: improvementId,
              changes_summary: 'AI-improved prompt'
            }
          ]
        }
      });

      handleShowChange(false);
      toast.success('Prompt improved successfully!');

      if (onPromptUpdated) {
        onPromptUpdated(improvedPrompt);
      }
    } catch (error) {
      console.error('Failed to save improved prompt:', error);
      toast.error('Failed to save improved prompt');
    }
  };

  const handleReject = () => {
    handleShowChange(false);
    toast.info('Kept original prompt');
  };

  if (showImprovement) {
    return (
      <div className="p-6 border-2 border-purple-500/30 rounded-xl bg-purple-500/5 backdrop-blur-sm w-full col-span-full">
        <PromptImprovement
          originalPrompt={promptText}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => handleShowChange(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm
                 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20
                 border border-purple-500/30 rounded-lg transition-all
                 hover:shadow-lg hover:shadow-purple-500/20"
    >
      <Sparkles className="w-4 h-4" />
      Improve with AI
    </button>
  );
}
