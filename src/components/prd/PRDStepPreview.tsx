import { Download, FileText, Loader2, Trash, Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';
import type { PRDDocument } from '../../types';
import { Button } from '../ui/Button';

interface PRDStepPreviewProps {
  selectedDocument: PRDDocument | null;
  generatedDocument: PRDDocument | null;
  documents: PRDDocument[] | undefined;
  onSelectDocument: (document: PRDDocument) => void;
  onExport: (documentId: string, format: 'markdown' | 'pdf' | 'docx') => Promise<void>;
  isExporting: boolean;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onSaveDocument?: (documentId: string, content: Record<string, unknown>) => Promise<void>;
  isSaving?: boolean;
}

const EXPORT_FORMATS: Array<{ label: string; value: 'markdown' | 'pdf' | 'docx' }> = [
  { label: 'Markdown', value: 'markdown' },
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
];

export function PRDStepPreview({
  selectedDocument,
  generatedDocument,
  documents,
  onSelectDocument,
  onExport,
  isExporting,
  onDeleteDocument,
  onSaveDocument,
  isSaving = false,
}: PRDStepPreviewProps) {
  const activeDocument = selectedDocument || generatedDocument || null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>({});

  const handleEditToggle = () => {
    if (!activeDocument) return;

    if (!isEditMode) {
      setEditedContent(activeDocument.content || {});
    }
    setIsEditMode(!isEditMode);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedContent({});
  };

  const handleSave = async () => {
    if (!activeDocument || !onSaveDocument) return;

    await onSaveDocument(activeDocument.id, editedContent);
    setIsEditMode(false);
  };

  const handleContentChange = (key: string, value: string) => {
    setEditedContent((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        {activeDocument ? (
          <div className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
              <div>
                <p className="text-sm uppercase tracking-wide text-purple-300">
                  {activeDocument.project_type.replace(/_/g, ' ')}
                </p>
                <h2 className="text-2xl font-semibold text-white">{activeDocument.title}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Updated {new Date(activeDocument.updated_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {isEditMode ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-500"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    {EXPORT_FORMATS.map((format) => (
                      <Button
                        key={format.value}
                        onClick={() => onExport(activeDocument.id, format.value)}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {format.label}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </header>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">Project overview</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-gray-400">Project</dt>
                  <dd className="text-sm text-gray-200">{activeDocument.project_name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-gray-400">Audience</dt>
                  <dd className="text-sm text-gray-200">{activeDocument.metadata?.targetAudience || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-gray-400">Summary</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-gray-200">
                    {activeDocument.metadata?.description || 'No summary captured yet.'}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="space-y-5">
              {Object.entries(activeDocument.content || {}).map(([sectionTitle, sectionValue]) => {
                const displayValue = isEditMode
                  ? editedContent[sectionTitle]
                  : sectionValue;

                return (
                  <article
                    key={sectionTitle}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <h4 className="text-lg font-semibold text-white mb-3">{formatHeading(sectionTitle)}</h4>
                    {isEditMode ? (
                      <textarea
                        value={typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue, null, 2)}
                        onChange={(e) => handleContentChange(sectionTitle, e.target.value)}
                        className="w-full min-h-[120px] rounded-xl bg-slate-900/60 px-4 py-3 text-sm text-gray-200 border border-white/10 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
                        placeholder="Enter content..."
                      />
                    ) : (
                      <SectionBody value={displayValue} />
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] items-center justify-center text-center">
            <div className="max-w-md space-y-3 text-gray-300">
              <FileText className="mx-auto h-12 w-12 text-purple-300" />
              <h2 className="text-xl font-semibold text-white">No PRD selected yet</h2>
              <p className="text-sm">
                Generate a new document or pick one from your saved list to see the full details here.
              </p>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Saved PRDs</h3>
            <span className="text-xs text-gray-400">
              {documents?.length ? `${documents.length} total` : 'Nothing yet'}
            </span>
          </div>
          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {documents?.map((document) => {
              const isActive = activeDocument?.id === document.id;
              return (
                <div
                  key={document.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? 'border-purple-400 bg-purple-500/10 shadow-inner shadow-purple-500/40'
                      : 'border-white/10 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{document.project_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(document.created_at).toLocaleDateString()} · {document.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectDocument(document)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteDocument(document.id)}
                        className="text-red-300 hover:text-red-200"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!documents || documents.length === 0) && (
              <p className="text-sm text-gray-400">
                Your generated PRDs will appear here for easy access and exporting later on.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-fuchsia-500/20 p-6 text-sm text-purple-50 space-y-3">
          <h4 className="text-white font-semibold">Quick reminder</h4>
          <p>
            Each PRD saves automatically after generation. Want to tweak something? Open the document,
            edit in Supabase, or regenerate with more details.
          </p>
        </div>
      </aside>
    </div>
  );
}

function SectionBody({ value }: { value: unknown }) {
  if (value == null) {
    return <p className="text-sm text-gray-400">Nothing filled in yet.</p>;
  }

  if (typeof value === 'string') {
    return <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-line">{value}</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className="text-sm text-gray-400">No items yet.</p>;
    }

    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="rounded-xl bg-slate-900/60 px-4 py-3 text-sm text-gray-200">
            {typeof item === 'string' ? (
              item
            ) : (
              <pre className="whitespace-pre-wrap text-xs text-gray-300">{JSON.stringify(item, null, 2)}</pre>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    return (
      <div className="rounded-xl bg-slate-900/60 px-4 py-3 text-xs text-gray-200">
        <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  }

  return <p className="text-sm text-gray-200">{String(value)}</p>;
}

function formatHeading(rawKey: string): string {
  return rawKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}
