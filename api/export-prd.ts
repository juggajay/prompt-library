import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from 'pdfkit';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

type PRDContent = Record<string, unknown>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error('PRD export missing Supabase configuration');
    return res.status(500).json({ error: 'Supabase configuration is missing' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { client: supabase, isServiceRole } = createSupabaseClient(token);
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  const { data: userData, error: authError } = isServiceRole
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  const user = userData?.user;

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { documentId, format } = req.body || {};

    if (!documentId || !format) {
      return res.status(400).json({ error: 'documentId and format are required' });
    }

    const { data: document, error } = await supabase
      .from('prd_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.user_id !== user.id) {
      return res.status(403).json({ error: 'You do not have access to this document' });
    }

    const content = (document.content || {}) as PRDContent;
    const baseFilename = `${document.project_name || 'PRD'}-PRD`;

    if (format === 'markdown') {
      const markdown = renderMarkdown(document, content);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.md"`);
      return res.status(200).send(markdown);
    }

    if (format === 'pdf') {
      const buffer = await renderPDF(document, content);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.pdf"`);
      return res.status(200).send(buffer);
    }

    if (format === 'docx') {
      const buffer = await renderDOCX(document, content);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.docx"`);
      return res.status(200).send(buffer);
    }

    return res.status(400).json({ error: 'Unsupported format' });
  } catch (error) {
    console.error('PRD export error:', error);
    return res.status(500).json({ error: 'Failed to export document' });
  }
}

function createSupabaseClient(token: string) {
  const isServiceRole = Boolean(supabaseServiceKey);

  if (isServiceRole) {
    return {
      client: createClient(supabaseUrl, supabaseServiceKey),
      isServiceRole: true,
    } as const;
  }

  return {
    client: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: { persistSession: false },
    }),
    isServiceRole: false,
  } as const;
}

function renderMarkdown(document: any, content: PRDContent): string {
  const parts: string[] = [];

  parts.push(`# ${document.title || 'Product Requirements Document'}`);
  parts.push('');
  parts.push(`**Project:** ${document.project_name || 'Unknown project'}`);
  parts.push(`**Type:** ${document.project_type || 'n/a'}`);
  parts.push(`**Created:** ${formatDate(document.created_at)}`);
  parts.push('');

  for (const [key, value] of Object.entries(content)) {
    parts.push(`## ${formatHeading(key)}`);
    parts.push('');
    parts.push(...formatValueAsMarkdown(value));
    parts.push('');
  }

  return parts.join('\n').trim();
}

async function renderPDF(document: any, content: PRDContent): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))));
    doc.on('error', reject);

    doc.fontSize(20).text(document.title || 'Product Requirements Document', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Project: ${document.project_name || 'Unknown'}`);
    doc.text(`Type: ${document.project_type || 'n/a'}`);
    doc.text(`Created: ${formatDate(document.created_at)}`);
    doc.moveDown();

    for (const [key, value] of Object.entries(content)) {
      doc.fontSize(16).fillColor('#4c1d95').text(formatHeading(key), { continued: false });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#0f172a');
      formatValueAsPlainText(value).forEach((line) => doc.text(line, { lineGap: 2 }));
      doc.moveDown();
    }

    doc.end();
  });
}

async function renderDOCX(document: any, content: PRDContent): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: document.title || 'Product Requirements Document',
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Project: ${document.project_name || 'Unknown'}` }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Type: ${document.project_type || 'n/a'}` }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Created: ${formatDate(document.created_at)}` }),
      ],
    }),
  ];

  for (const [key, value] of Object.entries(content)) {
    children.push(new Paragraph({
      text: formatHeading(key),
      heading: HeadingLevel.HEADING_2,
    }));

    formatValueAsPlainText(value).forEach((line) => {
      children.push(new Paragraph({ text: line }));
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function formatHeading(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Unknown date';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

function formatValueAsMarkdown(value: unknown): string[] {
  if (value == null) {
    return ['_Not provided_'];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ['_Not provided yet_'];
    }
    return value.flatMap((item) => {
      if (typeof item === 'string') {
        return [`- ${item}`];
      }
      if (typeof item === 'object' && item) {
        return ['- ' + JSON.stringify(item, null, 2)];
      }
      return [`- ${String(item)}`];
    });
  }

  if (typeof value === 'object') {
    return ['```json', JSON.stringify(value, null, 2), '```'];
  }

  return [String(value)];
}

function formatValueAsPlainText(value: unknown): string[] {
  if (value == null) {
    return ['Not provided yet.'];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ['Not provided yet.'];
    }
    return value.flatMap((item) => {
      if (typeof item === 'string') {
        return [`• ${item}`];
      }
      if (typeof item === 'object' && item) {
        const nested = formatValueAsPlainText(item);
        return nested.map((text, index) => (index === 0 ? `• ${text}` : `  ${text}`));
      }
      return [`• ${String(item)}`];
    });
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2).split('\n');
  }

  return [String(value)];
}
