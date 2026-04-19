export type UserRole = 'admin' | 'ops' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (userId: string) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}
