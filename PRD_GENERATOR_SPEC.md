# PRD Generator Feature - Technical Specification

## 🎯 Feature Overview

The PRD Generator is an AI-powered feature that allows users to create comprehensive Product Requirements Documents directly within the Prompt Library application. It leverages the existing infrastructure while adding new capabilities for document generation, template management, and export functionality.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Implementation](#api-implementation)
4. [Frontend Components](#frontend-components)
5. [UI/UX Specifications](#uiux-specifications)
6. [Integration Points](#integration-points)
7. [Mobile Responsiveness](#mobile-responsiveness)
8. [Implementation Phases](#implementation-phases)

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/TypeScript)               │
├─────────────────────────────────────────────────────────────────┤
│  PRD Generator    │  Template System  │  Export Module          │
│  Wizard          │  Management       │  (PDF/DOCX/MD)          │
├─────────────────────────────────────────────────────────────────┤
│                     React Query / State Management               │
├─────────────────────────────────────────────────────────────────┤
│                        API Layer (Vercel Functions)              │
├─────────────────────────────────────────────────────────────────┤
│  /api/generate-prd │ /api/prd-templates │ /api/export-prd      │
├─────────────────────────────────────────────────────────────────┤
│                      Supabase (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  prd_documents    │  prd_templates    │  prd_history           │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. Create Migration File: `/supabase-prd-migration.sql`

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PRD Templates table
CREATE TABLE prd_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  structure JSONB NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRD Documents table
CREATE TABLE prd_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES prd_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRD Generation History
CREATE TABLE prd_generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prd_document_id UUID REFERENCES prd_documents(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  generation_params JSONB NOT NULL,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prd_documents_user_id ON prd_documents(user_id);
CREATE INDEX idx_prd_documents_status ON prd_documents(status);
CREATE INDEX idx_prd_documents_project_type ON prd_documents(project_type);
CREATE INDEX idx_prd_templates_project_type ON prd_templates(project_type);
CREATE INDEX idx_prd_history_user_id ON prd_generation_history(user_id);
CREATE INDEX idx_prd_history_document_id ON prd_generation_history(prd_document_id);

-- RLS Policies
ALTER TABLE prd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_generation_history ENABLE ROW LEVEL SECURITY;

-- PRD Documents policies
CREATE POLICY "Users can view their own PRD documents"
  ON prd_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PRD documents"
  ON prd_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PRD documents"
  ON prd_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PRD documents"
  ON prd_documents FOR DELETE
  USING (auth.uid() = user_id);

-- PRD Templates policies
CREATE POLICY "Users can view public templates or their own"
  ON prd_templates FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create templates"
  ON prd_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON prd_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON prd_templates FOR DELETE
  USING (auth.uid() = created_by);

-- PRD Generation History policies
CREATE POLICY "Users can view their own generation history"
  ON prd_generation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation history"
  ON prd_generation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prd_documents_updated_at 
  BEFORE UPDATE ON prd_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prd_templates_updated_at 
  BEFORE UPDATE ON prd_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## API Implementation

### 1. `/api/generate-prd.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface GeneratePRDRequest {
  projectName: string;
  projectType: string;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const startTime = Date.now();
    const requestData: GeneratePRDRequest = req.body;

    // Generate PRD content using OpenAI
    const systemPrompt = `You are an expert product manager creating comprehensive PRDs. 
    Create a well-structured PRD with the following sections:
    1. Executive Summary
    2. Project Overview
    3. Goals and Objectives
    4. User Stories
    5. Functional Requirements
    6. Non-Functional Requirements
    7. Technical Architecture
    8. Success Metrics
    9. Timeline and Milestones
    10. Risks and Mitigation
    
    Format the response as JSON with each section containing structured content.`;

    const userPrompt = `Create a PRD for:
    Project: ${requestData.projectName}
    Type: ${requestData.projectType}
    Description: ${requestData.description}
    Target Audience: ${requestData.targetAudience}
    Functional Requirements: ${requestData.requirements.functional.join(', ')}
    Non-Functional Requirements: ${requestData.requirements.nonFunctional.join(', ')}
    Technical Requirements: ${requestData.requirements.technical.join(', ')}
    Timeline: ${requestData.timeline || 'Not specified'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const generatedContent = JSON.parse(completion.choices[0].message.content || '{}');
    const tokensUsed = completion.usage?.total_tokens || 0;
    const generationTime = Date.now() - startTime;

    // Save to database
    const { data: prdDocument, error: saveError } = await supabase
      .from('prd_documents')
      .insert({
        user_id: user.id,
        prompt_id: requestData.promptId,
        template_id: requestData.templateId,
        title: `${requestData.projectName} - Product Requirements Document`,
        project_name: requestData.projectName,
        project_type: requestData.projectType,
        content: generatedContent,
        metadata: {
          description: requestData.description,
          targetAudience: requestData.targetAudience,
          requirements: requestData.requirements,
          timeline: requestData.timeline
        }
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    // Log generation history
    await supabase.from('prd_generation_history').insert({
      user_id: user.id,
      prd_document_id: prdDocument.id,
      prompt_id: requestData.promptId,
      generation_params: requestData,
      tokens_used: tokensUsed,
      generation_time_ms: generationTime
    });

    return res.status(200).json({
      success: true,
      document: prdDocument,
      generationTime,
      tokensUsed
    });

  } catch (error) {
    console.error('PRD generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate PRD',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### 2. `/api/prd-templates.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Default PRD templates
const DEFAULT_TEMPLATES = [
  {
    name: 'Web Application',
    project_type: 'web_app',
    description: 'Comprehensive PRD template for web applications',
    structure: {
      sections: [
        'Executive Summary',
        'User Research & Personas',
        'User Journey Maps',
        'Feature List',
        'Technical Requirements',
        'API Specifications',
        'Security Requirements',
        'Performance Metrics',
        'Launch Strategy'
      ]
    },
    variables: ['app_name', 'target_users', 'core_features', 'tech_stack']
  },
  {
    name: 'Mobile Application',
    project_type: 'mobile_app',
    description: 'PRD template optimized for mobile app development',
    structure: {
      sections: [
        'App Overview',
        'Platform Requirements',
        'User Interface Guidelines',
        'Offline Functionality',
        'Push Notifications',
        'Device Features',
        'App Store Requirements',
        'Analytics & Tracking'
      ]
    },
    variables: ['app_name', 'platforms', 'key_features', 'target_devices']
  },
  {
    name: 'API Service',
    project_type: 'api',
    description: 'Technical PRD template for API services',
    structure: {
      sections: [
        'API Overview',
        'Endpoint Specifications',
        'Authentication & Authorization',
        'Rate Limiting',
        'Data Models',
        'Error Handling',
        'Versioning Strategy',
        'Documentation Requirements'
      ]
    },
    variables: ['service_name', 'api_consumers', 'endpoints', 'auth_method']
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Fetch templates
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: templates, error } = await supabase
        .from('prd_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If no templates exist, return defaults
      if (!templates || templates.length === 0) {
        return res.status(200).json({
          templates: DEFAULT_TEMPLATES,
          isDefault: true
        });
      }

      return res.status(200).json({
        templates,
        isDefault: false
      });

    } catch (error) {
      console.error('Template fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
  } else if (req.method === 'POST') {
    // Create custom template
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, description, project_type, structure, variables } = req.body;

      const { data: template, error } = await supabase
        .from('prd_templates')
        .insert({
          name,
          description,
          project_type,
          structure,
          variables,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ template });

    } catch (error) {
      console.error('Template creation error:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### 3. `/api/export-prd.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { marked } from 'marked';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, format } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch PRD document
    const { data: document, error } = await supabase
      .from('prd_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const content = document.content as any;

    switch (format) {
      case 'markdown':
        const markdown = generateMarkdown(content, document);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${document.project_name}-PRD.md"`);
        return res.status(200).send(markdown);

      case 'pdf':
        const pdfBuffer = await generatePDF(content, document);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${document.project_name}-PRD.pdf"`);
        return res.status(200).send(pdfBuffer);

      case 'docx':
        const docxBuffer = await generateDOCX(content, document);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${document.project_name}-PRD.docx"`);
        return res.status(200).send(docxBuffer);

      default:
        return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Export failed' });
  }
}

function generateMarkdown(content: any, document: any): string {
  let markdown = `# ${document.title}\n\n`;
  markdown += `**Project:** ${document.project_name}\n`;
  markdown += `**Type:** ${document.project_type}\n`;
  markdown += `**Created:** ${new Date(document.created_at).toLocaleDateString()}\n\n`;

  // Add each section
  Object.entries(content).forEach(([section, data]) => {
    markdown += `## ${section}\n\n`;
    if (typeof data === 'string') {
      markdown += `${data}\n\n`;
    } else if (Array.isArray(data)) {
      data.forEach((item: any) => {
        markdown += `- ${item}\n`;
      });
      markdown += '\n';
    } else if (typeof data === 'object') {
      markdown += '```json\n';
      markdown += JSON.stringify(data, null, 2);
      markdown += '\n```\n\n';
    }
  });

  return markdown;
}

async function generatePDF(content: any, document: any): Promise<Buffer> {
  // PDF generation logic
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(20).text(document.title);
  doc.fontSize(12).text(`Project: ${document.project_name}`);
  doc.text(`Type: ${document.project_type}`);
  doc.text(`Created: ${new Date(document.created_at).toLocaleDateString()}`);
  doc.moveDown();

  // Add content sections
  Object.entries(content).forEach(([section, data]) => {
    doc.fontSize(16).text(section);
    doc.fontSize(11);
    if (typeof data === 'string') {
      doc.text(data);
    } else if (Array.isArray(data)) {
      data.forEach((item: any) => {
        doc.text(`• ${item}`);
      });
    }
    doc.moveDown();
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function generateDOCX(content: any, document: any): Promise<Buffer> {
  // DOCX generation logic
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: document.title,
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          text: `Project: ${document.project_name}`,
        }),
        new Paragraph({
          text: `Type: ${document.project_type}`,
        }),
        new Paragraph({
          text: `Created: ${new Date(document.created_at).toLocaleDateString()}`,
        }),
        // Add more content sections...
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}
```

## Frontend Components

### 1. Types Definition: `/src/types/prd.ts`

```typescript
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
  created_at: string;
  updated_at: string;
}

export interface PRDDocument {
  id: string;
  user_id: string;
  prompt_id?: string;
  template_id?: string;
  title: string;
  project_name: string;
  project_type: ProjectType;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  content: PRDContent;
  metadata: PRDMetadata;
  version: number;
  parent_document_id?: string;
  created_at: string;
  updated_at: string;
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
  risksAndMitigation?: Risk[];
  [key: string]: any;
}

export interface PRDMetadata {
  description: string;
  targetAudience: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
    technical: string[];
  };
  timeline?: string;
}

export interface UserStory {
  id: string;
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

export interface Timeline {
  phases: Phase[];
  totalDuration: string;
}

export interface Phase {
  name: string;
  duration: string;
  deliverables: string[];
}

export interface Risk {
  risk: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export type ProjectType = 
  | 'web_app' 
  | 'mobile_app' 
  | 'api' 
  | 'desktop_app' 
  | 'data_pipeline' 
  | 'ai_agent' 
  | 'other';

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
```

### 2. Main Page Component: `/src/pages/PRDGenerator.tsx`

```tsx
import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { PRDGeneratorWizard } from '../components/prd/PRDGeneratorWizard';

export function PRDGenerator() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            PRD Generator
          </h1>
          <p className="text-gray-400 mt-2">
            Create comprehensive Product Requirements Documents with AI assistance
          </p>
        </div>
        
        <PRDGeneratorWizard />
      </div>
    </AppLayout>
  );
}
```

### 3. Wizard Component: `/src/components/prd/PRDGeneratorWizard.tsx`

```tsx
import React, { useState } from 'react';
import { PRDStepOverview } from './PRDStepOverview';
import { PRDStepRequirements } from './PRDStepRequirements';
import { PRDStepAIEnhancement } from './PRDStepAIEnhancement';
import { PRDStepPreview } from './PRDStepPreview';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GeneratePRDParams } from '../../types/prd';

const STEPS = [
  { id: 'overview', title: 'Project Overview', component: PRDStepOverview },
  { id: 'requirements', title: 'Requirements', component: PRDStepRequirements },
  { id: 'ai-enhancement', title: 'AI Enhancement', component: PRDStepAIEnhancement },
  { id: 'preview', title: 'Preview & Export', component: PRDStepPreview },
];

export function PRDGeneratorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<GeneratePRDParams>>({
    projectType: 'web_app',
    requirements: {
      functional: [],
      nonFunctional: [],
      technical: [],
    },
  });
  const [generatedPRD, setGeneratedPRD] = useState<any>(null);

  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data: Partial<GeneratePRDParams>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
      {/* Progress Bar */}
      <div className="h-2 bg-white/10 relative">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Indicator */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items.center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index === currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white' 
                      : index < currentStep 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/10 text-gray-400'}
                  `}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 ${
                      index < currentStep ? 'bg-green-500' : 'bg-white/10'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{STEPS[currentStep].title}</h2>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 min-h-[500px]">
        <CurrentStepComponent
          formData={formData}
          updateFormData={updateFormData}
          onGenerate={setGeneratedPRD}
          generatedPRD={generatedPRD}
        />
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-white/10 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        {currentStep < STEPS.length - 1 && (
          <Button
            onClick={handleNext}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 4. Step 1 Component: `/src/components/prd/PRDStepOverview.tsx`

```tsx
import React from 'react';
import the remainder of the document... (continues with the provided content)
```

### 5. Hook for PRD Generation: `/src/hooks/usePRDGenerator.ts`

```tsx
(Remaining content continues as provided in the original specification)
```

The rest of the sections—
