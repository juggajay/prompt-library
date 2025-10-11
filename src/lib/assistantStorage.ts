import type { BlueprintResponse, CLITaskResponse, ContextPackage } from '../types';

const STORAGE_KEYS = {
  context: 'assistant.contextPackage',
  blueprint: 'assistant.blueprint',
  tasks: 'assistant.cliTasks',
} as const;

export function saveContextPackage(pkg: ContextPackage) {
  try {
    localStorage.setItem(STORAGE_KEYS.context, JSON.stringify(pkg));
  } catch (error) {
    console.error('Failed to persist context package', error);
  }
}

export function loadContextPackage(): ContextPackage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.context);
    return raw ? (JSON.parse(raw) as ContextPackage) : null;
  } catch (error) {
    console.error('Failed to load context package', error);
    return null;
  }
}

export function clearContextPackage() {
  localStorage.removeItem(STORAGE_KEYS.context);
}

export function saveBlueprintSnapshot(blueprint: BlueprintResponse) {
  try {
    localStorage.setItem(STORAGE_KEYS.blueprint, JSON.stringify(blueprint));
  } catch (error) {
    console.error('Failed to persist blueprint snapshot', error);
  }
}

export function loadBlueprintSnapshot(): BlueprintResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.blueprint);
    return raw ? (JSON.parse(raw) as BlueprintResponse) : null;
  } catch (error) {
    console.error('Failed to load blueprint snapshot', error);
    return null;
  }
}

export function clearBlueprintSnapshot() {
  localStorage.removeItem(STORAGE_KEYS.blueprint);
}

export function saveTasksSnapshot(tasks: CLITaskResponse) {
  try {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to persist task snapshot', error);
  }
}

export function loadTasksSnapshot(): CLITaskResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tasks);
    return raw ? (JSON.parse(raw) as CLITaskResponse) : null;
  } catch (error) {
    console.error('Failed to load task snapshot', error);
    return null;
  }
}

export function clearTasksSnapshot() {
  localStorage.removeItem(STORAGE_KEYS.tasks);
}

export function clearAllAssistantData() {
  clearContextPackage();
  clearBlueprintSnapshot();
  clearTasksSnapshot();
}
