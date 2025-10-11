import { AppLayout } from '../components/layout/AppLayout';
import { PRDGeneratorWizard } from '../components/prd/PRDGeneratorWizard';

export function PRDGenerator() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="text-center space-y-2">
          <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            New
          </span>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
            Product Requirements Generator
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Give the AI your ideas and get a polished PRD you can share with teammates, investors, or future you.
            Beginner friendly with exports ready for docs, slides, or wikis.
          </p>
        </header>

        <PRDGeneratorWizard />
      </div>
    </AppLayout>
  );
}
