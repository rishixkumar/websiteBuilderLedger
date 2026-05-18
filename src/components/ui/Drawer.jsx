import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Drawer.css';

export function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} role="presentation" />
      <aside className="drawer" role="dialog" aria-modal="true">
        <header className="drawer__header">
          <h2>{title}</h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  );
}
