import { REGEX_PATTERNS } from '../constants/common';

// ============================================
// Formatters
// ============================================

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function titleCase(str: string): string {
  if (!str) return str;
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str) return str;
  const safeMaxLength = Math.max(0, Math.floor(maxLength) || 0);
  if (str.length <= safeMaxLength) return str;
  const safeSuffix = suffix ?? '...';
  if (safeMaxLength <= safeSuffix.length) return str.slice(0, safeMaxLength);
  return str.slice(0, safeMaxLength - safeSuffix.length) + safeSuffix;
}

export function truncateMiddle(str: string, maxLength: number, separator = '...'): string {
  if (!str) return str;
  const safeMaxLength = Math.max(0, Math.floor(maxLength) || 0);
  if (str.length <= safeMaxLength) return str;
  const safeSeparator = separator ?? '...';
  if (safeMaxLength <= safeSeparator.length) return str.slice(0, safeMaxLength);
  const charsToShow = safeMaxLength - safeSeparator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return str.slice(0, frontChars) + safeSeparator + str.slice(-backChars);
}

export function wrapText(str: string, maxWidth: number): string[] {
  if (!str) return [];
  const safeMaxWidth = Math.max(1, Math.floor(maxWidth) || 1);
  const words = str.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine && (currentLine + ' ' + word).length > safeMaxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function formatInitials(name: string): string {
  if (!name?.trim()) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join('')
    .slice(0, 2);
}

export function maskString(
  str: string,
  options: { showFirst?: number; showLast?: number; maskChar?: string } = {}
): string {
  if (!str) return '';
  const { showFirst = 0, showLast = 4, maskChar = '*' } = options;
  const safeShowFirst = Math.max(0, Math.floor(showFirst) || 0);
  const safeShowLast = Math.max(0, Math.floor(showLast) || 0);
  if (str.length <= safeShowFirst + safeShowLast) return str;
  const masked = maskChar.repeat(str.length - safeShowFirst - safeShowLast);
  return str.slice(0, safeShowFirst) + masked + str.slice(-safeShowLast);
}
