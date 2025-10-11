import { useState } from 'react';
import type { GeneratePRDParams } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PRDStepRequirementsProps {
  formData: Partial<GeneratePRDParams>;
  updateFormData: (updates: Partial<GeneratePRDParams>) => void;
}

interface RequirementEditorProps {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}

function RequirementEditor({ label, placeholder, items, onChange }: RequirementEditorProps) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (removeIndex: number) => {
    onChange(items.filter((_, index) => index !== removeIndex));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{label}</h3>
      <p className="text-sm text-gray-300 mt-1">Add one idea at a time. Press Enter or click add.</p>

      <div className="mt-4 flex items-center gap-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleAdd} type="button">
          Add
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-gray-200"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-xs text-gray-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-400">No items yet. Add your first thought above.</p>
      )}
    </div>
  );
}

export function PRDStepRequirements({ formData, updateFormData }: PRDStepRequirementsProps) {
  const requirements = formData.requirements || {
    functional: [],
    nonFunctional: [],
    technical: [],
  };

  const handleUpdate = (key: keyof typeof requirements) => (items: string[]) => {
    updateFormData({
      requirements: {
        ...requirements,
        [key]: items,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Requirements</h2>
        <p className="text-gray-300 mt-1">
          Capture your must-haves. Keep each bullet short and clear—we’ll polish the wording later.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RequirementEditor
          label="Functional requirements"
          placeholder="Users can sign in with email"
          items={requirements.functional || []}
          onChange={handleUpdate('functional')}
        />
        <RequirementEditor
          label="Non-functional requirements"
          placeholder="Page loads in under 3 seconds"
          items={requirements.nonFunctional || []}
          onChange={handleUpdate('nonFunctional')}
        />
        <RequirementEditor
          label="Technical notes"
          placeholder="Built with Next.js and Supabase"
          items={requirements.technical || []}
          onChange={handleUpdate('technical')}
        />
      </div>

      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 text-sm text-purple-100">
        <strong className="block text-purple-200">Need inspiration?</strong>
        Start with big themes (authentication, dashboard, notifications). We’ll transform them into
        detailed requirements automatically.
      </div>
    </div>
  );
}
