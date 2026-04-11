export default function Button({ children, onClick, variant = 'primary', style }) {
  const base = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'opacity 0.15s',
  };

  const variants = {
    primary: { background: '#2563eb', color: 'white' },
    secondary: { background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' },
    ghost: { background: 'transparent', color: '#6b7280' },
  };

  return (
    <button
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </button>
  );
}
