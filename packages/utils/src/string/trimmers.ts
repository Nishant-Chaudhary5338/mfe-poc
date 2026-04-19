import { REGEX_PATTERNS } from '../constants/common';

// ============================================
// Trimmers & Sanitizers
// ============================================

export function trimWhitespace(str: string): string {
  if (!str) return str;
  return str.trim().replace(REGEX_PATTERNS.WHITESPACE, ' ');
}

export function stripHtml(str: string): string {
  if (!str) return str;
  return str.replace(REGEX_PATTERNS.HTML_TAGS, '').replace(/&nbsp;/g, ' ').trim();
}

export function stripMarkdown(str: string): string {
  if (!str) return str;
  return str
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^>\s/gm, '')
    .trim();
}

export function normalizeWhitespace(str: string): string {
  if (!str) return str;
  return str.replace(REGEX_PATTERNS.WHITESPACE, ' ').trim();
}

export function removeNonAlphanumeric(str: string): string {
  if (!str) return str;
  return str.replace(REGEX_PATTERNS.SPECIAL_CHARS, '');
}

export function removeEmojis(str: string): string {
  if (!str) return str;
  try {
    return str.replace(/\p{Extended_Pictographic}/gu, '').replace(/\uFE0F/g, '');
  } catch {
    // Fallback for environments without Unicode property escapes support
    return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  }
}

export function removeDuplicates(str: string): string {
  if (!str) return str;
  return Array.from(new Set(str)).join('');
}

export function reverseString(str: string): string {
  if (!str) return str;
  return Array.from(str).reverse().join('');
}
