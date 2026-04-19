import { useDevAuth } from '../devAuth.tsx';
import type { DevUserRole } from '../devAuth.tsx';
import type { ReactNode, CSSProperties } from 'react';

interface PermissionGateProps {
  roles: DevUserRole[];
  children: ReactNode;
  /** hide = render nothing; disable = render greyed-out with lock tooltip */
  mode?: 'hide' | 'disable';
  message?: string;
  style?: CSSProperties;
}

export function PermissionGate({
  roles,
  children,
  mode = 'hide',
  message,
  style,
}: PermissionGateProps) {
  const { user } = useDevAuth();
  const allowed = user && roles.includes(user.role);

  if (allowed) return <>{children}</>;
  if (mode === 'hide') return null;

  const roleList = roles.join(' or ');
  const tip = message ?? `Requires ${roleList} role`;

  return (
    <span
      title={tip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        cursor: 'not-allowed',
        ...style,
      }}
    >
      <span style={{ pointerEvents: 'none', opacity: 0.45, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11 }}>🔒</span>
        {children}
      </span>
    </span>
  );
}
