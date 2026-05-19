import { useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Copy,
  ClipboardCopy,
  Trash2,
  CopyPlus,
  MessageSquarePlus,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { groupFieldsBySection, formatClientSummary } from '../../lib/utils';
import { FieldInput } from './FieldInput';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatRelative } from '../../lib/utils';
import './ClientDetail.css';

export function ClientDetail({ clientId, onClose }) {
  const { state, dispatch, getClient, getStage, showToast } = useApp();
  const client = getClient(clientId);
  const [noteText, setNoteText] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!client) return null;

  const stage = getStage(client.stageId);
  const sections = groupFieldsBySection(state.settings.fieldDefinitions);

  const updateField = (fieldId, value) => {
    dispatch({ type: 'SET_CLIENT_FIELD', clientId: client.id, fieldId, value });
  };

  const updateName = (name) => {
    dispatch({ type: 'UPDATE_CLIENT', id: client.id, patch: { name } });
  };

  const updateStage = (stageId) => {
    if (stageId !== client.stageId) {
      dispatch({ type: 'SET_CLIENT_STAGE', clientId: client.id, stageId });
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    dispatch({ type: 'ADD_ACTIVITY', clientId: client.id, text: noteText.trim() });
    setNoteText('');
    showToast('Note added');
  };

  const quickOpen = (url) => url && window.open(url, '_blank', 'noopener,noreferrer');
  const quickCopy = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    showToast('Copied');
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_CLIENT', id: client.id });
    showToast('Client deleted permanently');
    onClose?.();
  };

  const handleArchive = () => {
    dispatch({ type: 'ARCHIVE_CLIENT', id: client.id });
    showToast('Client archived');
    onClose?.();
  };

  const handleRestore = () => {
    dispatch({ type: 'RESTORE_CLIENT', id: client.id });
    showToast('Client restored');
  };

  return (
    <div className="client-detail">
      <div className="client-detail__top">
        <input
          className="client-detail__name"
          value={client.name}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Client name"
        />
        <select
          className="client-detail__stage"
          value={client.stageId}
          onChange={(e) => updateStage(e.target.value)}
        >
          {state.settings.pipelineStages
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
        </select>
        {stage && <Badge variant="stage" color={stage.color}>{stage.label}</Badge>}
      </div>

      <div className="client-detail__quick">
        <Button
          variant="secondary"
          size="sm"
          icon={ClipboardCopy}
          onClick={() => {
            const summary = formatClientSummary(
              client,
              state.settings.fieldDefinitions,
              stage?.label
            );
            navigator.clipboard.writeText(summary);
            showToast('Client summary copied');
          }}
        >
          Copy summary
        </Button>
        {client.fields?.website && (
          <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => quickOpen(client.fields.website)}>
            Website
          </Button>
        )}
        {client.fields?.googleMaps && (
          <Button variant="secondary" size="sm" icon={MapPin} onClick={() => quickOpen(client.fields.googleMaps)}>
            Maps
          </Button>
        )}
        {client.fields?.website && (
          <Button variant="ghost" size="sm" icon={Copy} onClick={() => quickCopy(client.fields.website)}>
            Copy URL
          </Button>
        )}
      </div>

      <div className="client-detail__tags">
        <label className="field-input__label">Tags (comma-separated)</label>
        <input
          value={(client.tags || []).join(', ')}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_CLIENT',
              id: client.id,
              patch: {
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              },
            })
          }
          placeholder="hvac, retail"
        />
      </div>

      {Object.entries(sections).map(([section, fields]) => (
        <section key={section} className="client-detail__section">
          <h4>{section}</h4>
          {fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={client.fields?.[field.id]}
              onChange={(v) => updateField(field.id, v)}
            />
          ))}
        </section>
      ))}

      <section className="client-detail__section client-detail__activity">
        <h4>Activity</h4>
        <div className="client-detail__note-form">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note or log a call..."
            rows={2}
          />
          <Button variant="primary" size="sm" icon={MessageSquarePlus} onClick={addNote}>
            Add note
          </Button>
        </div>
        <ul className="activity-list">
          {(client.activities || []).map((a) => (
            <li key={a.id} className={`activity-list__item activity-list__item--${a.type}`}>
              <span className="activity-list__text">{a.text}</span>
              <span className="activity-list__time">{formatRelative(a.at)}</span>
            </li>
          ))}
          {!client.activities?.length && (
            <li className="activity-list__empty">No activity yet</li>
          )}
        </ul>
      </section>

      <div className="client-detail__footer">
        <Button
          variant="ghost"
          size="sm"
          icon={CopyPlus}
          onClick={() => {
            dispatch({ type: 'DUPLICATE_CLIENT', id: client.id });
            showToast('Client duplicated');
          }}
        >
          Duplicate
        </Button>
        {client.archived ? (
          <Button variant="secondary" size="sm" icon={ArchiveRestore} onClick={handleRestore}>
            Restore
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon={Archive} onClick={handleArchive}>
            Archive
          </Button>
        )}
        <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete client?" size="sm">
        <p className="modal-text">This cannot be undone. “{client.name}” will be removed.</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
