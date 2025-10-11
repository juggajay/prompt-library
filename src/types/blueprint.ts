export interface BlueprintComponent {
  name: string;
  responsibility: string;
  notes?: string;
}

export interface BlueprintDataFlow {
  step: string;
  detail: string;
}

export interface BlueprintRecommendation {
  title: string;
  description: string;
}

export interface BlueprintPromptSuggestion {
  label: string;
  command: string;
  notes?: string;
}

export interface BlueprintArchitecture {
  summary: string;
  components: BlueprintComponent[];
  dataFlow: BlueprintDataFlow[];
  techStack: string[];
  recommendations: BlueprintRecommendation[];
}

export interface CLITask {
  title: string;
  description: string;
  cliPrompt: string;
  status: 'todo' | 'in_progress' | 'done';
  tags: string[];
  effort: 'xs' | 's' | 'm' | 'l';
}

export interface BlueprintResponse {
  blueprintId?: string;
  architecture: BlueprintArchitecture;
  nextSteps: string[];
  cliPrompts: BlueprintPromptSuggestion[];
}

export interface CLITaskResponse {
  tasks: CLITask[];
  summary: string;
  recommendations: string[];
}

export interface ContextQuestion {
  id: string;
  question: string;
  helper?: string;
}

export interface ContextFile {
  id: string;
  title: string;
  filename: string;
  purpose: string;
  content: string;
}

export interface ContextPrompt {
  title: string;
  instructions: string;
  prompt: string;
}

export interface ContextDecisions {
  techStack: string[];
  integrations: string[];
  quality: string[];
  notes?: string[];
}

export interface ContextPackage {
  packageId?: string;
  summary: string;
  projectName: string;
  projectType: string;
  targetAudience: string;
  assumptions: string[];
  decisions: ContextDecisions;
  files: ContextFile[];
  prompts: ContextPrompt[];
  nextSteps: string[];
}

export interface CreateBlueprintPayload {
  projectName: string;
  projectType: string;
  description: string;
  targetAudience: string;
  goals: string[];
  constraints?: string[];
}

export interface GenerateTasksPayload {
  projectName: string;
  projectType: string;
  description: string;
  architectureSummary: string;
  goals: string[];
}
