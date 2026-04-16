import { CSSProperties, MouseEventHandler, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  style?: CSSProperties;
}

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: { background: '#2563eb', color: 'white' },
  secondary: { background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' },
  ghost: { background: 'transparent', color: '#6b7280' },
};

const base: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  transition: 'opacity 0.15s',
};

export default function Button({ children, onClick, variant = 'primary', style }: ButtonProps) {
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
