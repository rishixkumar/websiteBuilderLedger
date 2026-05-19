import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import './SaveIndicator.css';

export function SaveIndicator({ status }) {
  if (status === 'saved') {
    return (
      <span className="save-indicator save-indicator--saved" title="All changes saved">
        <Cloud size={14} />
        Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="save-indicator save-indicator--error" title="Could not save locally">
        <CloudOff size={14} />
        Save failed
      </span>
    );
  }
  return (
    <span className="save-indicator save-indicator--saving">
      <Loader2 size={14} className="save-indicator__spin" />
      Saving…
    </span>
  );
}
