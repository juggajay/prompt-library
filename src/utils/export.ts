import type { Prompt } from '../types';

export type ExportFormat = 'json' | 'csv' | 'markdown';

/**
 * Export prompts to JSON format
 */
export function exportToJSON(prompts: Prompt[]): string {
  return JSON.stringify(prompts, null, 2);
}

/**
 * Export prompts to CSV format
 */
export function exportToCSV(prompts: Prompt[]): string {
  const headers = [
    'Title',
    'Category',
    'Prompt Text',
    'Description',
    'Tags',
    'Use Count',
    'Is Favorite',
    'Created At',
    'Updated At',
  ];

  const rows = prompts.map((prompt) => [
    escapeCSV(prompt.title),
    escapeCSV(prompt.category),
    escapeCSV(prompt.prompt_text),
    escapeCSV(prompt.description || ''),
    escapeCSV(prompt.tags.join(', ')),
    prompt.use_count.toString(),
    prompt.is_favorite ? 'Yes' : 'No',
    new Date(prompt.created_at).toLocaleDateString(),
    new Date(prompt.updated_at).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export prompts to Markdown format
 */
export function exportToMarkdown(prompts: Prompt[]): string {
  const sections = prompts.map((prompt) => {
    const lines = [
      `## ${prompt.title}`,
      '',
      `**Category:** ${prompt.category}`,
      `**Tags:** ${prompt.tags.join(', ') || 'None'}`,
      `**Use Count:** ${prompt.use_count}`,
      `**Favorite:** ${prompt.is_favorite ? '⭐ Yes' : 'No'}`,
      '',
    ];

    if (prompt.description) {
      lines.push(`**Description:**`, prompt.description, '');
    }

    lines.push(
      `**Prompt:**`,
      '```',
      prompt.prompt_text,
      '```',
      '',
      `*Created: ${new Date(prompt.created_at).toLocaleDateString()} | Last Updated: ${new Date(prompt.updated_at).toLocaleDateString()}*`,
      '',
      '---',
      ''
    );

    return lines.join('\n');
  });

  const header = [
    `# My Prompt Library`,
    '',
    `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    '',
    `Total Prompts: ${prompts.length}`,
    '',
    '---',
    '',
  ].join('\n');

  return header + sections.join('\n');
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download file to user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export prompts in the specified format
 */
export function exportPrompts(prompts: Prompt[], format: ExportFormat) {
  const timestamp = new Date().toISOString().split('T')[0];
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'json':
      content = exportToJSON(prompts);
      filename = `prompts-${timestamp}.json`;
      mimeType = 'application/json';
      break;

    case 'csv':
      content = exportToCSV(prompts);
      filename = `prompts-${timestamp}.csv`;
      mimeType = 'text/csv';
      break;

    case 'markdown':
      content = exportToMarkdown(prompts);
      filename = `prompts-${timestamp}.md`;
      mimeType = 'text/markdown';
      break;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadFile(content, filename, mimeType);
}
