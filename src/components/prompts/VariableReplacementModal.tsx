import { useState } from 'react';
import { X, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { extractVariables, replaceVariables, type TemplateVariable } from '../../utils/templates';
import { toast } from 'sonner';

interface VariableReplacementModalProps {
  template: string;
  promptTitle: string;
  onClose: () => void;
  onCopy?: (text: string) => void;
}

export function VariableReplacementModal({
  template,
  promptTitle,
  onClose,
  onCopy,
}: VariableReplacementModalProps) {
  const variables = extractVariables(template);
  const [values, setValues] = useState<Record<string, string>>(
    variables.reduce((acc, name) => ({ ...acc, [name]: '' }), {})
  );
  const [preview, setPreview] = useState(template);

  const handleValueChange = (name: string, value: string) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);

    // Update preview
    const templateVars: TemplateVariable[] = Object.entries(newValues).map(([name, value]) => ({
      name,
      value,
    }));
    setPreview(replaceVariables(template, templateVars));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      if (onCopy) {
        onCopy(preview);
      }
      toast.success('Copied to clipboard!');
      onClose();
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const allFilled = variables.every(name => values[name].trim() !== '');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Fill Template Variables
            </h2>
            <p className="text-gray-400 text-sm mt-1">{promptTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Variables Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Variables</h3>
            {variables.map((name) => (
              <Input
                key={name}
                label={name}
                value={values[name]}
                onChange={(e) => handleValueChange(name, e.target.value)}
                placeholder={`Enter value for ${name}`}
              />
            ))}
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <pre className="text-white whitespace-pre-wrap font-mono text-sm">{preview}</pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              disabled={!allFilled}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
