import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { loadContextPackage, loadBlueprintSnapshot, loadTasksSnapshot } from '../lib/assistantStorage';

export function AssistantOverview() {
  const [status, setStatus] = useState(() => ({
    contextReady: false,
    blueprintReady: false,
    tasksReady: false,
  }));

  useEffect(() => {
    const contextReady = Boolean(loadContextPackage());
    const blueprintReady = Boolean(loadBlueprintSnapshot());
    const tasksReady = Boolean(loadTasksSnapshot()?.tasks?.length);
    setStatus({ contextReady, blueprintReady, tasksReady });
  }, []);

  const modules = [
    {
      title: 'Context Builder',
      description: 'Capture your idea, answer smart questions, and generate AI-ready context files.',
      status: status.contextReady ? 'Ready' : 'Not started',
      href: '/assistant/context',
      accent: 'from-purple-500 to-fuchsia-500',
    },
    {
      title: 'Architecture & Tasks',
      description: 'Draft architecture notes and a CLI-friendly task list for your coding assistant.',
      status: status.blueprintReady ? (status.tasksReady ? 'Ready' : 'Blueprint ready') : 'Not started',
      href: '/assistant/architecture',
      accent: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'PRD Generator',
      description: 'Turn decisions into a polished PRD, review with Nova, and export for stakeholders.',
      status: 'Open',
      href: '/assistant/prd-generator',
      accent: 'from-emerald-500 to-lime-500',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-10">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-purple-300">Project Assistant</p>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Build with AI, step by step
          </h1>
          <p className="text-gray-300 max-w-3xl">
            Move through a guided workflow—from idea to architecture to PRD—without overwhelming forms. Pick any module to get started or resume where you left off.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article key={module.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${module.accent} flex items-center justify-center text-white font-semibold`}>
                  {module.title.split(' ')[0].charAt(0)}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">{module.title}</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">{module.description}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-gray-400">Status: {module.status}</span>
                <Link to={module.href}>
                  <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500">
                    Open
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
