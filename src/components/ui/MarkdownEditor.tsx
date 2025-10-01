import { forwardRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { cn } from '../../lib/utils';

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value?: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  height?: number;
  className?: string;
}

const MarkdownEditor = forwardRef<HTMLDivElement, MarkdownEditorProps>(
  ({ value, onChange, label, error, placeholder, height = 400, className }, ref) => {
    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <div
          className={cn(
            'border rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-200',
            error ? 'border-red-500' : 'border-white/10',
            className
          )}
          data-color-mode="dark"
        >
          <MDEditor
            value={value}
            onChange={onChange}
            height={height}
            preview="live"
            textareaProps={{
              placeholder: placeholder || 'Enter your markdown here...',
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        {/* Custom dark theme styles */}
        <style>{`
          .w-md-editor {
            background: rgba(255, 255, 255, 0.05) !important;
            border: none !important;
            color: #fff !important;
          }

          .w-md-editor-toolbar {
            background: rgba(255, 255, 255, 0.08) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 8px !important;
          }

          .w-md-editor-toolbar button {
            color: rgba(255, 255, 255, 0.7) !important;
            transition: all 0.2s !important;
          }

          .w-md-editor-toolbar button:hover {
            background: rgba(168, 85, 247, 0.2) !important;
            color: #fff !important;
          }

          .w-md-editor-toolbar button[data-active="true"] {
            background: rgba(168, 85, 247, 0.3) !important;
            color: #fff !important;
          }

          .w-md-editor-toolbar li.active button {
            background: rgba(168, 85, 247, 0.3) !important;
            color: #fff !important;
          }

          .w-md-editor-text-pre,
          .w-md-editor-text-input {
            background: rgba(255, 255, 255, 0.03) !important;
            color: #fff !important;
          }

          .w-md-editor-text-pre > code,
          .w-md-editor-text-input {
            color: #fff !important;
          }

          .w-md-editor-preview {
            background: rgba(255, 255, 255, 0.03) !important;
            color: #fff !important;
          }

          .wmde-markdown {
            background: transparent !important;
            color: #fff !important;
          }

          .wmde-markdown h1,
          .wmde-markdown h2,
          .wmde-markdown h3,
          .wmde-markdown h4,
          .wmde-markdown h5,
          .wmde-markdown h6 {
            color: #fff !important;
            border-bottom-color: rgba(255, 255, 255, 0.1) !important;
          }

          .wmde-markdown a {
            color: #a78bfa !important;
          }

          .wmde-markdown code {
            background: rgba(168, 85, 247, 0.15) !important;
            color: #e9d5ff !important;
          }

          .wmde-markdown pre {
            background: rgba(0, 0, 0, 0.3) !important;
          }

          .wmde-markdown pre code {
            background: transparent !important;
          }

          .wmde-markdown blockquote {
            border-left-color: rgba(168, 85, 247, 0.5) !important;
            color: rgba(255, 255, 255, 0.8) !important;
          }

          .wmde-markdown table {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }

          .wmde-markdown table th,
          .wmde-markdown table td {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }

          .wmde-markdown table tr {
            background: rgba(255, 255, 255, 0.02) !important;
          }

          .wmde-markdown table tr:nth-child(2n) {
            background: rgba(255, 255, 255, 0.05) !important;
          }

          .w-md-editor-text::placeholder {
            color: rgba(255, 255, 255, 0.3) !important;
          }

          /* Scrollbar styling */
          .w-md-editor-text-pre::-webkit-scrollbar,
          .w-md-editor-preview::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .w-md-editor-text-pre::-webkit-scrollbar-track,
          .w-md-editor-preview::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }

          .w-md-editor-text-pre::-webkit-scrollbar-thumb,
          .w-md-editor-preview::-webkit-scrollbar-thumb {
            background: rgba(168, 85, 247, 0.3);
            border-radius: 4px;
          }

          .w-md-editor-text-pre::-webkit-scrollbar-thumb:hover,
          .w-md-editor-preview::-webkit-scrollbar-thumb:hover {
            background: rgba(168, 85, 247, 0.5);
          }
        `}</style>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export { MarkdownEditor };
