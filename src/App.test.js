jest.mock('uuid', () => ({
  v4: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
}));

import { loadWorkspace, saveWorkspace } from './lib/storage';
import { STORAGE_KEY, createDefaultWorkspace } from './lib/defaults';
import { mergeWorkspaces, parseImportJSON } from './lib/exportImport';
import { searchClients, isCallOverdue } from './lib/utils';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loadWorkspace returns default when empty', () => {
    const ws = loadWorkspace();
    expect(ws.version).toBe(1);
    expect(ws.clients.length).toBeGreaterThan(0);
    expect(ws.clients[0].name).toContain('HVAC');
  });

  test('save and load roundtrip', () => {
    const ws = createDefaultWorkspace();
    ws.clients[0].name = 'Test Co';
    saveWorkspace(ws);
    const loaded = loadWorkspace();
    expect(loaded.clients[0].name).toBe('Test Co');
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});

describe('exportImport', () => {
  test('parseImportJSON validates structure', () => {
    const ws = createDefaultWorkspace();
    const parsed = parseImportJSON(JSON.stringify(ws));
    expect(parsed.clients).toHaveLength(1);
  });

  test('mergeWorkspaces adds new clients', () => {
    const a = createDefaultWorkspace();
    const b = createDefaultWorkspace();
    b.clients.push({ ...b.clients[0], id: 'new-id', name: 'Merged Co' });
    const merged = mergeWorkspaces(a, b);
    expect(merged.clients).toHaveLength(2);
  });
});

describe('utils', () => {
  test('searchClients finds by name', () => {
    const ws = createDefaultWorkspace();
    const results = searchClients(ws.clients, 'hvac', ws.settings.fieldDefinitions);
    expect(results).toHaveLength(1);
  });

  test('isCallOverdue detects past dates', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isCallOverdue(past)).toBe(true);
  });
});
