import { COLORS } from '../../lib/constants';

export default function Loading({ size = 36, text = null }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 48,
    }}>
      <div style={{
        width: size,
        height: size,
        border: `2px solid ${COLORS.red}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {text && <div style={{ color: COLORS.dim, fontSize: 13 }}>{text}</div>}
    </div>
  );
}

export function FullPageLoading({ text = 'Yükleniyor...' }) {
  return (
    <div style={{
      background: COLORS.bg,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Loading size={40} text={text} />
    </div>
  );
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4 }) {
  return (
    <div style={{
      width,
      height,
      background: COLORS.card,
      borderRadius,
      animation: 'pulse 1.5s infinite',
    }} />
  );
}