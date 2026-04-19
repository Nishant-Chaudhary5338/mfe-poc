import { REGEX_PATTERNS } from '../constants/common';

export function isValidEmail(value: string): boolean {
  if (!value?.trim()) return false;
  return REGEX_PATTERNS.EMAIL.test(value);
}

export function isValidUrl(value: string): boolean {
  if (!value?.trim()) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return REGEX_PATTERNS.URL.test(value);
  }
}

export function isValidSlug(value: string): boolean {
  if (!value?.trim()) return false;
  return REGEX_PATTERNS.SLUG.test(value);
}

export function isPalindrome(value: string): boolean {
  if (!value?.trim()) return true;
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

export function generateSlug(text: string): string {
  if (!text?.trim()) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateRandomString(
  length: number,
  options: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean } = {}
): string {
  const { uppercase = true, lowercase = true, numbers = true, symbols = false } = options;
  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  const safeLength = Math.max(0, Math.floor(length) || 0);
  if (safeLength === 0) return '';

  const randomValues = new Uint32Array(safeLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < safeLength; i++) {
      randomValues[i] = Math.floor(Math.random() * chars.length);
    }
  }

  let result = '';
  for (let i = 0; i < safeLength; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(8, { lowercase: true, numbers: true });
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const randomValues = new Uint8Array(1);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues);
    } else {
      randomValues[0] = Math.floor(Math.random() * 256);
    }
    const r = randomValues[0] % 16;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
