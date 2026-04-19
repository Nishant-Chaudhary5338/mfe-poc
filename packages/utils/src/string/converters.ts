// ============================================
// Case Converters
// ============================================

export function toCamelCase(str: string): string {
  if (!str?.trim()) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

export function toSnakeCase(str: string): string {
  if (!str?.trim()) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function toKebabCase(str: string): string {
  if (!str?.trim()) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toPascalCase(str: string): string {
  if (!str?.trim()) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

export function toDotCase(str: string): string {
  if (!str?.trim()) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1.$2')
    .replace(/[\s_-]+/g, '.')
    .toLowerCase();
}

export function toConstantCase(str: string): string {
  if (!str?.trim()) return '';
  return toSnakeCase(str).toUpperCase();
}

export function toSentenceCase(str: string): string {
  if (!str?.trim()) return '';
  const result = str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[\s_-]+/g, ' ')
    .trim();
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}
