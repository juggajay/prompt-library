import { X, Keyboard } from 'lucide-react';
import { formatShortcut, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ shortcuts, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-300 mb-6">
            Use these keyboard shortcuts to navigate and interact with the app more efficiently.
          </p>

          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-white">{shortcut.description}</span>
                <kbd className="px-3 py-2 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 rounded-lg text-purple-300 font-mono text-sm shadow-lg">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-sm text-gray-300 text-center">
              Press <kbd className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 font-mono text-xs">?</kbd> anytime to see this help
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
