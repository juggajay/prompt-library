import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { embed, embedMany } from 'ai';
import { embeddingModel, openai } from './openai';

export interface TextChunk {
  content: string;
  index: number;
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

export interface ChunkWithEmbedding extends TextChunk {
  embedding: number[];
}

/**
 * Split text into chunks with overlap
 */
export async function chunkText(
  text: string,
  chunkSize = 1000,
  chunkOverlap = 200
): Promise<TextChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    lengthFunction: (text) => text.length,
  });

  const chunks = await splitter.splitText(text);

  return chunks.map((content, index) => ({
    content,
    index,
  }));
}

/**
 * Add contextual information to chunks for better retrieval
 * Based on Anthropic's contextual chunking technique
 */
export async function addContextToChunk(
  chunk: string,
  fullDocument: string,
  documentTitle: string
): Promise<string> {
  // For very long documents, truncate to first 4000 chars for context
  const truncatedDoc = fullDocument.slice(0, 4000);

  const contextPrompt = `<document>
Title: ${documentTitle}

${truncatedDoc}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
${chunk}
</chunk>

Please give a short succinct context (2-3 sentences) to situate this chunk within the overall document for retrieval purposes. Only provide the context, no preamble.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: contextPrompt }],
      max_tokens: 200,
    });

    const context = response.choices[0].message.content || '';
    return `${context}\n\n${chunk}`;
  } catch (error) {
    console.error('Failed to add context to chunk:', error);
    // Return original chunk if context generation fails
    return chunk;
  }
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(
  chunks: TextChunk[]
): Promise<ChunkWithEmbedding[]> {
  const contents = chunks.map((c) => c.content);

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: contents,
  });

  return chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
}

/**
 * Generate a single embedding for a query
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  return embedding;
}

/**
 * Clean and normalize text content
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/^\s+|\s+$/gm, '') // Trim lines
    .trim();
}

/**
 * Extract sections from markdown content
 */
export function extractSections(markdown: string): Array<{
  title: string;
  content: string;
  level: number;
}> {
  const sections: Array<{ title: string; content: string; level: number }> = [];
  const lines = markdown.split('\n');

  let currentSection: { title: string; content: string; level: number } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      currentSection = { title, content: '', level };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Chunk text with section awareness
 */
export async function chunkWithSections(
  markdown: string,
  chunkSize = 1000,
  chunkOverlap = 200
): Promise<TextChunk[]> {
  const sections = extractSections(markdown);
  const chunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionText = `# ${section.title}\n\n${section.content}`;

    if (sectionText.length <= chunkSize) {
      // Section fits in one chunk
      chunks.push({
        content: sectionText.trim(),
        index: globalIndex++,
        sectionTitle: section.title,
      });
    } else {
      // Split section into multiple chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
      });

      const sectionChunks = await splitter.splitText(sectionText);

      for (const chunkContent of sectionChunks) {
        chunks.push({
          content: chunkContent.trim(),
          index: globalIndex++,
          sectionTitle: section.title,
        });
      }
    }
  }

  return chunks;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
