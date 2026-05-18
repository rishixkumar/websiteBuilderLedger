import './Toast.css';

export function Toast({ message, type = 'success' }) {
  if (!message) return null;
  return (
    <div className={`toast toast--${type}`} role="status">
      {message}
    </div>
  );
}
