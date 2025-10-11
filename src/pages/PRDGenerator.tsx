import { AppLayout } from '../components/layout/AppLayout';
import { PRDGeneratorWizard } from '../components/prd/PRDGeneratorWizard';

export function PRDGenerator() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-purple-300">Project Assistant</p>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
            Product Requirements Generator
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Use your context and architecture decisions to draft a complete PRD. Generate, refine with Nova, and export in minutes.
          </p>
        </header>

        <PRDGeneratorWizard />
      </div>
    </AppLayout>
  );
}
