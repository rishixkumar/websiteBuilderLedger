import './FieldInput.css';

export function FieldInput({ field, value, onChange, readOnly }) {
  const id = `field-${field.id}`;
  const label = (
    <label htmlFor={id} className="field-input__label">
      {field.label}
    </label>
  );

  if (readOnly) {
    return (
      <div className="field-input field-input--readonly">
        {label}
        <div className="field-input__value">{formatReadonly(field, value)}</div>
      </div>
    );
  }

  switch (field.type) {
    case 'textarea':
      return (
        <div className="field-input">
          {label}
          <textarea id={id} value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} />
        </div>
      );
    case 'checkbox':
      return (
        <div className="field-input field-input--checkbox">
          <label className="field-input__checkbox-label">
            <input
              id={id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            {field.label}
          </label>
        </div>
      );
    case 'select':
      return (
        <div className="field-input">
          {label}
          <select id={id} value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    case 'datetime':
      return (
        <div className="field-input">
          {label}
          <input
            id={id}
            type="datetime-local"
            value={toLocalDatetime(value)}
            onChange={(e) => onChange(fromLocalDatetime(e.target.value))}
          />
        </div>
      );
    case 'date':
      return (
        <div className="field-input">
          {label}
          <input
            id={id}
            type="date"
            value={value ? value.slice(0, 10) : ''}
            onChange={(e) => onChange(e.target.value ? `${e.target.value}T00:00:00.000Z` : '')}
          />
        </div>
      );
    case 'currency':
    case 'number':
      return (
        <div className="field-input">
          {label}
          <input
            id={id}
            type="number"
            step={field.type === 'currency' ? '0.01' : '1'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case 'url':
    case 'email':
    case 'phone':
    case 'text':
    default:
      return (
        <div className="field-input">
          {label}
          <input
            id={id}
            type={
              field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'
            }
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.type === 'url' ? 'https://' : ''}
          />
        </div>
      );
  }
}

function formatReadonly(field, value) {
  if (field.type === 'checkbox') return value ? 'Yes' : 'No';
  if (!value) return '—';
  return String(value);
}

function toLocalDatetime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function fromLocalDatetime(local) {
  if (!local) return '';
  return new Date(local).toISOString();
}
