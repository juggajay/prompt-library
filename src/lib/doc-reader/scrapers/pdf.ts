import type { ScrapedContent } from './html';

export async function parsePDF(_url: string): Promise<ScrapedContent> {
  // PDF parsing not yet implemented in browser environment
  // This would require server-side implementation with proper binary handling
  throw new Error('PDF parsing is not yet implemented. Please use HTML documentation URLs.');
}