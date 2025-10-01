import { Link } from 'react-router-dom';
import { BookOpen, Search, Star, Tags, Zap, Lock, TrendingUp, Copy } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Your AI Prompt
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Library
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Organize, search, and manage all your AI prompts in one beautiful place.
              Never lose track of your best prompts again.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              No credit card required • Free forever
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to manage prompts
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features to organize and optimize your AI workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Search className="w-8 h-8" />}
            title="Smart Search"
            description="Find any prompt instantly with full-text search and AI-powered semantic search"
          />
          <FeatureCard
            icon={<Tags className="w-8 h-8" />}
            title="Smart Organization"
            description="Organize with categories, tags, and favorites. Filter and sort however you like"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="AI-Powered"
            description="Auto-categorization and quality scoring with OpenAI integration"
          />
          <FeatureCard
            icon={<Copy className="w-8 h-8" />}
            title="One-Click Copy"
            description="Copy prompts to clipboard instantly with automatic usage tracking"
          />
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="Secure & Private"
            description="Your prompts are encrypted and protected with enterprise-grade security"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Usage Analytics"
            description="Track which prompts you use most and optimize your workflow"
          />
          <FeatureCard
            icon={<Star className="w-8 h-8" />}
            title="Favorites"
            description="Star your best prompts for quick access when you need them"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Unlimited Prompts"
            description="Store as many prompts as you need, completely free"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to organize your prompts?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have organized their AI workflow
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Using Prompt Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-white">Prompt Library</span>
          </div>
          <p className="text-sm">
            Built with ❤️ using React, TypeScript, Supabase, and OpenAI
          </p>
          <p className="text-xs mt-2">
            © 2025 Prompt Library. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
