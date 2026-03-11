export default function Input({
  label,
  error,
  type = 'text',
  ...props
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          letterSpacing: '0.1em',
          color: 'var(--muted)',
          marginBottom: 8,
        }}>
          {label.toUpperCase()}
        </label>
      )}
      <input
        type={type}
        style={{
          width: '100%',
          background: 'var(--subtle-bg)',
          border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
          borderRadius: 4,
          padding: '12px 14px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--red)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : 'var(--border)';
        }}
        {...props}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export function Textarea({ label, error, rows = 4, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          letterSpacing: '0.1em',
          color: 'var(--muted)',
          marginBottom: 8,
        }}>
          {label.toUpperCase()}
        </label>
      )}
      <textarea
        rows={rows}
        style={{
          width: '100%',
          background: 'var(--subtle-bg)',
          border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
          borderRadius: 4,
          padding: '12px 14px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--red)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : 'var(--border)';
        }}
        {...props}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export function Select({ label, error, options = [], ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          letterSpacing: '0.1em',
          color: 'var(--muted)',
          marginBottom: 8,
        }}>
          {label.toUpperCase()}
        </label>
      )}
      <select
        style={{
          width: '100%',
          background: 'var(--subtle-bg)',
          border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
          borderRadius: 4,
          padding: '12px 14px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          cursor: 'pointer',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}