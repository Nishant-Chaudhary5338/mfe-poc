import type { User } from './types.ts';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Nishant', email: 'alice@tvplus.com', role: 'admin' },
  { id: '2', name: 'Bob Ops',    email: 'bob@tvplus.com',   role: 'ops'   },
  { id: '3', name: 'Carol Editor', email: 'carol@tvplus.com', role: 'editor' },
  { id: '4', name: 'Dave Viewer', email: 'dave@tvplus.com', role: 'viewer' },
];
