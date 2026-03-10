import { COLORS } from '../../lib/constants';

export default function Button({
  children,
  onClick,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  ...props
}) {
  const sizes = {
    small: { padding: '8px 16px', fontSize: 11 },
    medium: { padding: '12px 24px', fontSize: 12 },
    large: { padding: '16px 32px', fontSize: 13 },
  };

  const variants = {
    primary: {
      background: COLORS.red,
      color: COLORS.white,
      border: 'none',
      hoverBg: '#c8000b',
    },
    secondary: {
      background: 'rgba(255,255,255,0.1)',
      color: COLORS.white,
      border: 'none',
      hoverBg: 'rgba(255,255,255,0.15)',
    },
    outline: {
      background: 'transparent',
      color: COLORS.red,
      border: `1px solid ${COLORS.red}`,
      hoverBg: 'rgba(232,0,13,0.1)',
    },
    ghost: {
      background: 'transparent',
      color: COLORS.dim,
      border: 'none',
      hoverBg: 'rgba(255,255,255,0.05)',
    },
  };

  const style = {
    ...sizes[size],
    ...variants[variant],
    borderRadius: 4,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    letterSpacing: '0.08em',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: fullWidth ? '100%' : 'auto',
    transition: 'all 0.2s',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.background = variants[variant].hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.background = variants[variant].background;
      }}
      {...props}
    >
      {loading && (
        <span style={{
          width: 14,
          height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      )}
      {children}
    </button>
  );
}