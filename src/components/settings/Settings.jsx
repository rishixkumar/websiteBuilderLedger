import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../context/AppContext';
import { exportJSON, exportCSV, parseImportJSON, mergeWorkspaces } from '../../lib/exportImport';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Sun, Moon, Download, Upload, Trash2 } from 'lucide-react';
import './Settings.css';

const FIELD_TYPES = ['text', 'url', 'email', 'phone', 'date', 'datetime', 'textarea', 'number', 'currency', 'checkbox', 'select'];

export function Settings() {
  const { state, dispatch, showToast } = useApp();
  const { settings } = state;
  const [importMode, setImportMode] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const updateStage = (id, patch) => {
    const stages = settings.pipelineStages.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    dispatch({ type: 'UPDATE_STAGES', stages });
  };

  const addStage = () => {
    const stages = [
      ...settings.pipelineStages,
      { id: uuidv4(), label: 'New Stage', color: '#6b7280', order: settings.pipelineStages.length },
    ];
    dispatch({ type: 'UPDATE_STAGES', stages });
  };

  const removeStage = (id) => {
    if (settings.pipelineStages.length <= 1) return;
    const stages = settings.pipelineStages.filter((s) => s.id !== id);
    dispatch({ type: 'UPDATE_STAGES', stages });
  };

  const updateField = (id, patch) => {
    const fields = settings.fieldDefinitions.map((f) =>
      f.id === id ? { ...f, ...patch } : f
    );
    dispatch({ type: 'UPDATE_FIELDS', fields });
  };

  const addField = () => {
    const fields = [
      ...settings.fieldDefinitions,
      {
        id: uuidv4(),
        label: 'New Field',
        type: 'text',
        section: 'Custom',
        order: settings.fieldDefinitions.length,
      },
    ];
    dispatch({ type: 'UPDATE_FIELDS', fields });
  };

  const removeField = (id) => {
    const fields = settings.fieldDefinitions.filter((f) => f.id !== id);
    dispatch({ type: 'UPDATE_FIELDS', fields });
  };

  const handleImport = (e, replace) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportJSON(reader.result);
        if (replace) {
          dispatch({ type: 'IMPORT_WORKSPACE', workspace: { ...imported, ui: state.ui } });
          showToast('Data replaced from backup');
        } else {
          const merged = mergeWorkspaces(
            { version: state.version, settings: state.settings, clients: state.clients },
            imported
          );
          dispatch({ type: 'IMPORT_WORKSPACE', workspace: { ...merged, ui: state.ui } });
          showToast('Data merged from backup');
        }
      } catch (err) {
        showToast(err.message || 'Import failed', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setImportMode(null);
  };

  const clearAll = () => {
    localStorage.removeItem('websitetracker:v1');
    window.location.reload();
  };

  return (
    <div className="settings">
      <header className="settings__header">
        <h1>Settings</h1>
        <p>Customize fields, pipeline stages, and manage your data</p>
      </header>

      <section className="settings__section">
        <h2>Appearance</h2>
        <div className="settings__theme">
          <Button
            variant={settings.theme === 'dark' ? 'primary' : 'secondary'}
            icon={Moon}
            onClick={() => dispatch({ type: 'SET_THEME', theme: 'dark' })}
          >
            Dark
          </Button>
          <Button
            variant={settings.theme === 'light' ? 'primary' : 'secondary'}
            icon={Sun}
            onClick={() => dispatch({ type: 'SET_THEME', theme: 'light' })}
          >
            Light
          </Button>
        </div>
      </section>

      <section className="settings__section">
        <div className="settings__section-head">
          <h2>Pipeline stages</h2>
          <Button variant="secondary" size="sm" onClick={addStage}>Add stage</Button>
        </div>
        <ul className="settings-list">
          {settings.pipelineStages
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <li key={s.id} className="settings-list__item">
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => updateStage(s.id, { color: e.target.value })}
                  aria-label="Stage color"
                />
                <input
                  value={s.label}
                  onChange={(e) => updateStage(s.id, { label: e.target.value })}
                />
                <input
                  type="number"
                  className="settings-list__order"
                  value={s.order}
                  onChange={(e) => updateStage(s.id, { order: Number(e.target.value) })}
                  aria-label="Order"
                />
                <button
                  type="button"
                  className="settings-list__remove"
                  onClick={() => removeStage(s.id)}
                  aria-label="Remove stage"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="settings__section">
        <div className="settings__section-head">
          <h2>Custom fields</h2>
          <Button variant="secondary" size="sm" onClick={addField}>Add field</Button>
        </div>
        <ul className="settings-list settings-list--fields">
          {settings.fieldDefinitions
            .sort((a, b) => a.order - b.order)
            .map((f) => (
              <li key={f.id} className="settings-list__item settings-list__item--field">
                <input
                  value={f.label}
                  onChange={(e) => updateField(f.id, { label: e.target.value })}
                  placeholder="Label"
                />
                <select
                  value={f.type}
                  onChange={(e) => updateField(f.id, { type: e.target.value })}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  value={f.section || ''}
                  onChange={(e) => updateField(f.id, { section: e.target.value })}
                  placeholder="Section"
                />
                <label className="settings-list__pin">
                  <input
                    type="checkbox"
                    checked={!!f.pinned}
                    onChange={(e) => updateField(f.id, { pinned: e.target.checked })}
                  />
                  Pin
                </label>
                <button
                  type="button"
                  className="settings-list__remove"
                  onClick={() => removeField(f.id)}
                  aria-label="Remove field"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="settings__section">
        <h2>Data backup</h2>
        <p className="settings__hint">Export regularly — data is stored only in this browser.</p>
        <div className="settings__actions">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => {
              exportJSON({ version: state.version, settings: state.settings, clients: state.clients });
              showToast('JSON exported');
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => {
              exportCSV({ version: state.version, settings: state.settings, clients: state.clients });
              showToast('CSV exported');
            }}
          >
            Export CSV
          </Button>
          <Button variant="secondary" icon={Upload} onClick={() => setImportMode('merge')}>
            Import (merge)
          </Button>
          <Button variant="ghost" icon={Upload} onClick={() => setImportMode('replace')}>
            Import (replace all)
          </Button>
        </div>
        <input
          id="import-file"
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={(e) => handleImport(e, importMode === 'replace')}
        />
      </section>

      <section className="settings__section settings__section--danger">
        <h2>Danger zone</h2>
        <Button variant="danger" onClick={() => setConfirmClear(true)}>
          Clear all data & reset
        </Button>
      </section>

      <Modal open={!!importMode} onClose={() => setImportMode(null)} title={importMode === 'replace' ? 'Replace all data?' : 'Import backup'} size="sm">
        <p className="modal-text">
          {importMode === 'replace'
            ? 'This will replace all current clients and settings with the backup file.'
            : 'New clients from the backup will be added. Existing clients are kept.'}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setImportMode(null)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => document.getElementById('import-file')?.click()}
          >
            Choose file
          </Button>
        </div>
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all data?" size="sm">
        <p className="modal-text">This deletes everything and reloads the app with sample data. Export a backup first.</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button variant="danger" onClick={clearAll}>Clear & reset</Button>
        </div>
      </Modal>
    </div>
  );
}
