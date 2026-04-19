import type { User } from './types.ts';

export function encodeToken(user: User): string {
  return btoa(JSON.stringify(user));
}

export function decodeToken(token: string): User | null {
  try {
    return JSON.parse(atob(token)) as User;
  } catch {
    return null;
  }
}
