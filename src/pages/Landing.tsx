import { Link } from 'react-router-dom';
import {
  BookOpen, Search, Star, Tags, Zap, Lock, TrendingUp, Copy,
  Sparkles, ArrowRight, Check, Users, BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0tNCAwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

      {/* Floating orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"></div>
      <div className="fixed top-40 right-10 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float-delayed"></div>
      <div className="fixed bottom-20 left-1/3 w-80 h-80 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float-slow"></div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-6 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Prompt Library
              </span>
            </div>
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              <span className="text-sm">AI-Powered Prompt Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl font-black leading-tight">
              <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
                Never Lose
              </span>
              <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-delayed">
                A Great Prompt
              </span>
              <span className="block text-white">Again</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Organize, search, and manage your AI prompts with powerful features.
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-semibold">
                Built for professionals. Free forever.
              </span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start For Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg rounded-2xl backdrop-blur-sm"
              >
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span><strong className="text-white">10,000+</strong> active users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span><strong className="text-white">4.9/5</strong> rating</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-fuchsia-400" />
                <span><strong className="text-white">50,000+</strong> prompts saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Everything you need
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Powerful features to supercharge your AI workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BentoCard
              icon={<Search className="w-8 h-8" />}
              title="Lightning-Fast Search"
              description="Find any prompt instantly with full-text and AI-powered semantic search"
              gradient="from-purple-500 to-fuchsia-500"
            />
            <BentoCard
              icon={<Zap className="w-8 h-8" />}
              title="AI Auto-Categorization"
              description="Smart categorization and tagging powered by OpenAI"
              gradient="from-fuchsia-500 to-orange-500"
              large
            />
            <BentoCard
              icon={<Tags className="w-8 h-8" />}
              title="Smart Organization"
              description="Categories, tags, and folders to keep everything organized"
              gradient="from-cyan-500 to-blue-500"
            />
            <BentoCard
              icon={<Copy className="w-8 h-8" />}
              title="One-Click Copy"
              description="Copy to clipboard with automatic usage tracking"
              gradient="from-orange-500 to-red-500"
            />
            <BentoCard
              icon={<Star className="w-8 h-8" />}
              title="Favorites & Bookmarks"
              description="Star your best prompts for instant access"
              gradient="from-yellow-500 to-orange-500"
            />
            <BentoCard
              icon={<Lock className="w-8 h-8" />}
              title="Enterprise Security"
              description="Bank-level encryption and Row-Level Security"
              gradient="from-green-500 to-emerald-500"
            />
            <BentoCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Usage Analytics"
              description="Track performance and optimize your workflow"
              gradient="from-blue-500 to-purple-500"
              large
            />
            <BentoCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Quality Scoring"
              description="AI-powered prompt quality assessment"
              gradient="from-purple-500 to-pink-500"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border border-white/10 rounded-3xl p-12 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                  10,000+
                </div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  50,000+
                </div>
                <div className="text-gray-400">Prompts Organized</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                  99.9%
                </div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="relative bg-gradient-to-br from-purple-600 via-fuchsia-600 to-orange-600 rounded-3xl p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bS00IDBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="relative text-center">
              <h2 className="text-5xl font-black text-white mb-6">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of professionals organizing their AI prompts with Prompt Library
              </p>
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Get Started - It's Free Forever
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Free forever
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">Prompt Library</span>
            </div>
            <p className="text-sm mb-2">
              Built with React, TypeScript, Supabase & OpenAI
            </p>
            <p className="text-xs">
              © 2025 Prompt Library. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

interface BentoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  large?: boolean;
}

function BentoCard({ icon, title, description, gradient, large }: BentoCardProps) {
  return (
    <div
      className={`group relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-2xl ${
        large ? 'md:col-span-2' : ''
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl blur"
           style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${gradient} mb-4 group-hover:scale-110 transition-transform`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
