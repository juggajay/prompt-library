import { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../../services/docReaderService';

interface ChatInterfaceProps {
  guideId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface({ guideId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await askQuestion(guideId, question);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Ask Questions</h3>
        <p className="text-xs text-gray-400 mt-1">Chat with your documentation</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-400 mt-8">
            <p>Ask a question about this documentation</p>
            <p className="text-xs mt-2">Example: "How do I get started?"</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                    : 'bg-white/10 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this documentation..."
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
