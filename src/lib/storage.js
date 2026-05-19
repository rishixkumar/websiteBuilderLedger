import { STORAGE_KEY, createDefaultWorkspace } from './defaults';

let saveTimer = null;

export function loadWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultWorkspace();
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return createDefaultWorkspace();
    return data;
  } catch {
    return createDefaultWorkspace();
  }
}

export function saveWorkspace(workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}

export function debouncedSave(workspace, delay = 400) {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const ok = saveWorkspace(workspace);
      resolve(ok);
    }, delay);
  });
}

export function saveWorkspaceSync(workspace) {
  return saveWorkspace(workspace);
}
