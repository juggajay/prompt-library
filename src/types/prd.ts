export type ProjectType =
  | 'web_app'
  | 'mobile_app'
  | 'api'
  | 'desktop_app'
  | 'data_pipeline'
  | 'ai_agent'
  | 'other';

export interface PRDTemplate {
  id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  structure: {
    sections: string[];
  };
  variables: string[];
  is_public: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserStory {
  as: string;
  want: string;
  so: string;
  acceptanceCriteria: string[];
}

export interface TechnicalSpec {
  stack: string[];
  architecture: string;
  integrations: string[];
  deployment: string;
}

export interface Metric {
  name: string;
  target: string;
  measurement: string;
}

export interface TimelinePhase {
  name: string;
  duration: string;
  deliverables: string[];
}

export interface Timeline {
  totalDuration: string;
  phases: TimelinePhase[];
}

export interface RiskItem {
  risk: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface PRDContent {
  executiveSummary?: string;
  projectOverview?: string;
  goalsAndObjectives?: string[];
  userStories?: UserStory[];
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
  technicalArchitecture?: TechnicalSpec;
  successMetrics?: Metric[];
  timeline?: Timeline;
  risksAndMitigation?: RiskItem[];
  [key: string]: unknown;
}

export interface PRDMetadata {
  description: string;
  targetAudience: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
    technical: string[];
  };
  timeline?: string | null;
}

export interface PRDDocument {
  id: string;
  user_id: string;
  prompt_id?: string | null;
  template_id?: string | null;
  title: string;
  project_name: string;
  project_type: ProjectType;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  content: PRDContent;
  metadata: PRDMetadata;
  version: number;
  parent_document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratePRDParams {
  projectName: string;
  projectType: ProjectType;
  description: string;
  targetAudience: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
    technical: string[];
  };
  timeline?: string;
  promptId?: string;
  templateId?: string;
}

export interface GeneratePRDResponse {
  success: boolean;
  document: PRDDocument;
  meta: {
    tokensUsed: number;
    generationTimeMs: number;
  };
}
