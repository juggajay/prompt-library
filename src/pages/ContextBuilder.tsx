import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { PRDStepIdea } from '../components/prd/PRDStepIdea';
import { useContextPackage, useContextQuestions } from '../hooks/useContextAssistant';
import type { ContextPackage, ContextQuestion } from '../types';
import {
  loadContextPackage,
  saveContextPackage,
  clearBlueprintSnapshot,
  clearTasksSnapshot,
} from '../lib/assistantStorage';

export function ContextBuilder() {
  const [idea, setIdea] = useState('');
  const [questions, setQuestions] = useState<ContextQuestion[]>([]);
  const [contextPackage, setContextPackage] = useState<ContextPackage | null>(null);

  const questionsMutation = useContextQuestions();
  const packageMutation = useContextPackage();

  useEffect(() => {
    const stored = loadContextPackage();
    if (stored) {
      setContextPackage(stored);
      setIdea(stored.summary || stored.projectName || '');
    }
  }, []);

  const handleGenerateQuestions = async () => {
    if (!idea.trim()) return;

    try {
      const result = await questionsMutation.mutateAsync(idea.trim());
      setQuestions(result);
      setContextPackage(null);
    } catch {
      // handled by hook toast
    }
  };

  const handleGeneratePackage = async (
    answers: Array<{ id: string; question: string; answer: string }>
  ) => {
    if (!idea.trim()) return;

    try {
      const result = await packageMutation.mutateAsync({
        idea: idea.trim(),
        answers: answers.filter((item) => item.answer.trim().length > 0),
      });

      setContextPackage(result);
      saveContextPackage(result);
      clearBlueprintSnapshot();
      clearTasksSnapshot();
    } catch {
      // handled by hook toast
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-purple-300">Project Assistant</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Context Builder
          </h1>
          <p className="text-gray-300 max-w-3xl">
            Capture your idea, answer a few smart questions, and get a complete context package for Claude, Cursor, or ChatGPT.
          </p>
        </header>

        <PRDStepIdea
          idea={idea}
          setIdea={setIdea}
          questions={questions}
          onGenerateQuestions={handleGenerateQuestions}
          isGeneratingQuestions={questionsMutation.isPending}
          onGeneratePackage={handleGeneratePackage}
          isGeneratingPackage={packageMutation.isPending}
          contextPackage={contextPackage}
        />
      </div>
    </AppLayout>
  );
}
