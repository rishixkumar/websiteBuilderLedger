import { useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from './Modal';
import './ShortcutsModal.css';

const SHORTCUTS = [
  { keys: ['?'], desc: 'Show keyboard shortcuts' },
  { keys: ['/'], desc: 'Focus search (Clients / Pipeline)' },
  { keys: ['n'], desc: 'Quick add client' },
  { keys: ['Esc'], desc: 'Close modals and drawers' },
];

export function ShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <div className="shortcuts-modal">
        <p className="shortcuts-modal__intro">
          <Keyboard size={16} />
          Work faster with these shortcuts (desktop).
        </p>
        <ul className="shortcuts-modal__list">
          {SHORTCUTS.map(({ keys, desc }) => (
            <li key={desc}>
              <span className="shortcuts-modal__desc">{desc}</span>
              <span className="shortcuts-modal__keys">
                {keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
