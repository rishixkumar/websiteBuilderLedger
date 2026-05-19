import { useState, useRef, useCallback } from 'react';
import { Sparkles, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  parseClientWithAI,
  clientFromExtraction,
  readFileAsDataUrl,
  isImageFile,
  isTextFile,
} from '../../lib/clientFromExtraction';
import './QuickAddModal.css';

export function QuickAddModal({ open, onClose }) {
  const { state, dispatch, showToast, getStage: getStageFromCtx } = useApp();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [step, setStep] = useState('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setText('');
    setFiles([]);
    setStep('input');
    setLoading(false);
    setError('');
    setPreview(null);
    setDragOver(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFiles = async (fileList) => {
    const incoming = Array.from(fileList);
    const next = [...files];

    for (const file of incoming) {
      if (isImageFile(file)) {
        const dataUrl = await readFileAsDataUrl(file);
        next.push({ id: `${file.name}-${Date.now()}`, type: 'image', name: file.name, dataUrl });
      } else if (isTextFile(file)) {
        const textContent = await file.text();
        setText((t) => (t ? `${t}\n\n${textContent}` : textContent));
      } else {
        showToast(`Skipped ${file.name} — use images or text files`, 'info');
      }
    }

    setFiles(next.slice(0, 6));
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) await processFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setFiles((f) => f.filter((x) => x.id !== id));

  const handleExtract = async () => {
    if (!text.trim() && files.length === 0) {
      setError('Add notes, paste text, or drop screenshots/images.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const extraction = await parseClientWithAI({
        text,
        imageDataUrls: files.map((f) => f.dataUrl),
        fieldDefinitions: state.settings.fieldDefinitions,
        pipelineStages: state.settings.pipelineStages,
      });
      setPreview(extraction);
      setStep('preview');
    } catch (err) {
      const msg = err.message || 'Extraction failed';
      if (msg.includes('404') || msg.includes('Failed to fetch')) {
        setError(
          'AI API unavailable. Run `npm run dev:full` locally, or deploy to Vercel with OLLAMA_API_KEY set.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!preview) return;
    const client = clientFromExtraction(preview);
    dispatch({ type: 'ADD_CLIENT', client });
    dispatch({ type: 'SET_VIEW', view: 'clients' });
    showToast(`Created ${client.name}`);
    handleClose();
  };

  const stage = preview ? getStageFromCtx(preview.stageId) : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'preview' ? 'Review extracted client' : 'Quick Add from files'}
      size="lg"
    >
      {step === 'input' && (
        <div className="quick-add">
          <p className="quick-add__intro">
            Drop screenshots from Notes, paste client details, or upload images. AI will extract
            name, links, calls, and project info into a new client.
          </p>

          <div
            className={`quick-add__dropzone ${dragOver ? 'quick-add__dropzone--active' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <Upload size={28} />
            <span>Drop images or click to upload</span>
            <span className="quick-add__hint">PNG, JPG, screenshots — up to 6 files</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.txt,.md,text/plain"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) processFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {files.length > 0 && (
            <div className="quick-add__previews">
              {files.map((f) => (
                <div key={f.id} className="quick-add__thumb">
                  <img src={f.dataUrl} alt={f.name} />
                  <button type="button" onClick={() => removeFile(f.id)} aria-label="Remove">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="quick-add__label">
            <FileText size={16} />
            Notes or pasted text
          </label>
          <textarea
            className="quick-add__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Paste from Notes, email, or type client details…\n\nExample:\nHVAC Bee Alpharetta\nhttps://example.com\nScheduled call Wednesday 10 AM'}
            rows={6}
          />

          {error && <p className="quick-add__error">{error}</p>}

          <div className="quick-add__actions">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={loading ? Loader2 : Sparkles}
              onClick={handleExtract}
              disabled={loading}
            >
              {loading ? 'Extracting…' : 'Extract with AI'}
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="quick-add quick-add--preview">
          <div className="quick-add__preview-header">
            <h3>{preview.name}</h3>
            {stage && (
              <Badge variant="stage" color={stage.color}>
                {stage.label}
              </Badge>
            )}
          </div>

          {preview.tags?.length > 0 && (
            <div className="quick-add__tags">
              {preview.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          )}

          <dl className="quick-add__fields">
            {Object.entries(preview.fields || {}).map(([key, value]) => {
              if (!value) return null;
              const def = state.settings.fieldDefinitions.find((f) => f.id === key);
              return (
                <div key={key} className="quick-add__field-row">
                  <dt>{def?.label || key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              );
            })}
          </dl>

          {preview.activityNote && (
            <p className="quick-add__note">
              <ImageIcon size={14} />
              {preview.activityNote}
            </p>
          )}

          <div className="quick-add__actions">
            <Button variant="secondary" onClick={() => setStep('input')}>
              Back
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create client
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
