import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle, ArrowRight, Download, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
  id: string;
  text: string;
  category: string;
  reasoning: string;
  type: 'text' | 'choice' | 'number';
  options?: string[];
  priority: string;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  question?: Question;
}

interface GeneratedRules {
  rules: {
    [category: string]: Array<{
      id: string;
      title: string;
      description: string;
      rationale: string;
      priority: string;
      enforcement?: string;
      example?: string;
    }>;
  };
  config_files?: {
    [filename: string]: string;
  };
  recommended_tools?: string[];
  next_steps?: string[];
}

interface ProjectRulesGeneratorProps {
  promptId: string;
  promptContent: string;
}

export function ProjectRulesGenerator({ promptId, promptContent }: ProjectRulesGeneratorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userInput, setUserInput] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedRules, setGeneratedRules] = useState<GeneratedRules | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRuleGeneration = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rules/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          promptContent,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        const projectType = data.analysis?.project_type || 'project';
        setMessages([
          {
            role: 'assistant',
            content: `I've analyzed your prompt and detected you're building a **${projectType.replace('_', ' ')}**.

To generate the best rules, I'll ask you ${data.questions?.length || 0} quick questions (about ${data.estimatedTime || '3-5 minutes'}).

Let's get started! 🚀`
          }
        ]);

        setCurrentQuestion(data.firstQuestion);
        setProgress({ current: 1, total: data.questions.length });
        toast.success('Analysis complete! Let\'s start the conversation.');
      } else {
        throw new Error(data.error || 'Failed to start');
      }
    } catch (err: any) {
      console.error('Failed to start rule generation:', err);
      setError(err.message || 'Failed to start. Please try again.');
      toast.error('Failed to start rule generation');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerText?: string) => {
    const answer = answerText || userInput;
    if (!answer.trim() || !currentQuestion || !sessionId) return;

    const userMessage = { role: 'user' as const, content: answer };
    setMessages((prev) => [...prev, userMessage]);

    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/rules/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAnswer: answer,
          questionId: currentQuestion.id
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.hasMoreQuestions) {
          // Show next question
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.nextQuestion.text,
              question: data.nextQuestion
            }
          ]);
          setCurrentQuestion(data.nextQuestion);
          setProgress(data.progress);
        } else if (data.shouldGenerateRules) {
          // All questions done - generate rules
          await generateRules();
        }
      } else {
        throw new Error(data.error || 'Failed to submit answer');
      }
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRules = async () => {
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '🎨 Perfect! I have everything I need. Generating your customized project rules now...'
      }
    ]);

    try {
      const response = await fetch('/api/rules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedRules(data.rules);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `✅ Done! I've generated ${data.totalRules} customized rules for your project.`
          }
        ]);
        toast.success('Rules generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate rules');
      }
    } catch (err: any) {
      console.error('Failed to generate rules:', err);
      toast.error('Failed to generate rules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadRules = () => {
    if (!generatedRules) return;

    const blob = new Blob([JSON.stringify(generatedRules, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-rules.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rules downloaded!');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && userInput.trim()) {
      submitAnswer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Start Button */}
      {!sessionId && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Sparkles className="w-12 h-12 text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Generate Project-Specific Rules
                </h3>
                <p className="text-gray-400">
                  Get AI-powered, customized development rules tailored to your project's tech stack,
                  scale, and requirements.
                </p>
              </div>
              <Button
                onClick={startRuleGeneration}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Rule Generation
                  </>
                )}
              </Button>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation */}
      {sessionId && (
        <div className="space-y-4">
          {/* Progress Bar */}
          {progress.total > 0 && !generatedRules && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-200">
                    Question {progress.current} of {progress.total}
                  </span>
                  <span className="text-sm text-blue-400">
                    {Math.round((progress.current / progress.total) * 100)}% complete
                  </span>
                </div>
                <div className="w-full bg-blue-900/30 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card className="bg-gray-900/50">
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto p-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      message.role === 'assistant'
                        ? 'bg-purple-500/10 border border-purple-500/30'
                        : 'bg-blue-500/10 border border-blue-500/30 ml-8'
                    }`}
                  >
                    <p className="text-sm text-gray-100 whitespace-pre-wrap">{message.content}</p>
                    {message.question?.reasoning && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        💡 {message.question.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          {currentQuestion && !generatedRules && (
            <Card>
              <CardContent className="pt-4">
                {currentQuestion.type === 'choice' && currentQuestion.options ? (
                  <div className="grid grid-cols-1 gap-2">
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => submitAnswer(option)}
                        disabled={loading}
                        className="p-3 text-left border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all disabled:opacity-50 text-gray-200"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type={currentQuestion.type === 'number' ? 'number' : 'text'}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your answer..."
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                    <Button
                      onClick={submitAnswer}
                      disabled={loading || !userInput.trim()}
                      data-submit-btn
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Rules Display */}
          {generatedRules && (
            <div className="space-y-4">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-green-200">
                        Rules Generated Successfully!
                      </span>
                    </div>
                    <Button
                      onClick={downloadRules}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rules by Category */}
              <div className="space-y-4">
                {Object.entries(generatedRules.rules || {}).map(([category, rules]: [string, any]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">
                        {category.replace('_', ' ')} ({rules.length} rules)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {rules.map((rule: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-purple-500"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-white">{rule.title}</h4>
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  rule.priority === 'P0'
                                    ? 'bg-red-500/20 text-red-300'
                                    : rule.priority === 'P1'
                                    ? 'bg-orange-500/20 text-orange-300'
                                    : rule.priority === 'P2'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-gray-500/20 text-gray-300'
                                }`}
                              >
                                {rule.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{rule.description}</p>
                            {rule.rationale && (
                              <p className="text-xs text-gray-400 italic mb-2">
                                💭 Why: {rule.rationale}
                              </p>
                            )}
                            {rule.example && (
                              <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                                {rule.example}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Config Files */}
              {generatedRules.config_files && Object.keys(generatedRules.config_files).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(generatedRules.config_files).map(([filename, content]: [string, any]) => (
                        <details key={filename} className="p-3 bg-gray-800/50 rounded-lg">
                          <summary className="font-mono text-sm cursor-pointer text-purple-300 hover:text-purple-200">
                            {filename}
                          </summary>
                          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                          </pre>
                        </details>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Tools */}
              {generatedRules.recommended_tools && generatedRules.recommended_tools.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generatedRules.recommended_tools.map((tool: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
