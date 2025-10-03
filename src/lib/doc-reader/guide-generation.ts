import { openai } from './openai';
import { estimateTokens } from './text-processing';

const GUIDE_SYSTEM_PROMPT = `You are an expert technical writer specializing in implementation guides. Your task is to create comprehensive, well-structured technical documentation from provided source material.

## Guidelines:
- Write clear, concise, and accurate technical content
- Use active voice and present tense
- Define technical terms on first use
- Include practical, runnable code examples
- Structure content hierarchically from simple to complex
- Provide context before diving into technical details

## Output Requirements:
- Format: Markdown
- Structure: Follow the standard implementation guide format
- Code Examples: Include language identifiers for syntax highlighting
- Tone: Professional but approachable
- Audience: Intermediate developers

## Quality Standards:
- All code must be syntactically correct
- Include error handling in examples
- Add inline comments for complex logic
- Ensure version numbers are specified when relevant
- Include expected outputs for examples

## Required Sections:
1. **Overview** - Brief introduction (2-3 sentences) explaining what this is and why it matters
2. **Prerequisites** - Required software, dependencies, prior knowledge, API keys
3. **Installation** - Step-by-step installation with copy-paste ready commands
4. **Configuration** - How to configure with complete examples
5. **Usage** - Step-by-step usage instructions with code examples
6. **Common Patterns** - Best practices and recommended patterns
7. **Troubleshooting** - Common errors and their solutions
8. **Next Steps** - Where to go from here

Always cite specific sections from the source material when making technical claims.`;

export interface GuideGenerationResult {
  guide: string;
  tokensUsed: number;
  model: string;
}

export async function generateImplementationGuide(
  content: string,
  title: string,
  sourceUrl: string
): Promise<GuideGenerationResult> {
  // Check token count and truncate if necessary
  const tokens = estimateTokens(content);
  const maxTokens = 120000; // Leave room for response

  let processedContent = content;
  if (tokens > maxTokens) {
    // Truncate to fit within limits
    const charLimit = maxTokens * 4; // Rough approximation
    processedContent = content.slice(0, charLimit) + '\n\n[Content truncated due to length...]';
  }

  const userPrompt = `Create a comprehensive implementation guide based on the following documentation.

**Source Title:** ${title}
**Source URL:** ${sourceUrl}

**Source Content:**
${processedContent}

Generate a complete, production-ready implementation guide following the required format. Focus on practical, actionable content that developers can immediately use.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: GUIDE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 16000,
    });

    const guide = response.choices[0].message.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      guide,
      tokensUsed,
      model: 'gpt-4o',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate guide: ${error.message}`);
    }
    throw error;
  }
}

export async function generateQuickSummary(content: string): Promise<string> {
  const tokens = estimateTokens(content);
  const maxTokens = 120000;

  let processedContent = content;
  if (tokens > maxTokens) {
    const charLimit = maxTokens * 4;
    processedContent = content.slice(0, charLimit);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a technical summarization expert. Create concise, accurate summaries.',
        },
        {
          role: 'user',
          content: `Summarize the key points of this documentation in 3-5 bullet points:\n\n${processedContent}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw error;
  }
}

export async function improveContent(
  content: string,
  instructions: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a technical writing expert. Improve the provided content according to the user\'s instructions while maintaining technical accuracy.',
        },
        {
          role: 'user',
          content: `Current content:\n\n${content}\n\nImprovement instructions:\n${instructions}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to improve content: ${error.message}`);
    }
    throw error;
  }
}

export async function extractKeyTopics(content: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract 5-10 key topics or concepts from the provided documentation. Return only a JSON array of strings.',
        },
        {
          role: 'user',
          content: content.slice(0, 8000), // Limit for topic extraction
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"topics":[]}');
    return result.topics || [];
  } catch (error) {
    console.error('Failed to extract topics:', error);
    return [];
  }
}
