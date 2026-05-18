import './Badge.css';

export function Badge({ children, color, variant = 'default', className = '' }) {
  const style = color ? { '--badge-color': color } : undefined;
  return (
    <span className={`badge badge--${variant} ${className}`} style={style}>
      {children}
    </span>
  );
}
