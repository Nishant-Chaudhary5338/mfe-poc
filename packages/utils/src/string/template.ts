// ============================================
// Template Interpolation
// ============================================

export function interpolate(
  template: string,
  data: Record<string, string | number | boolean>
): string {
  if (!template) return template;
  if (!data || Object.keys(data).length === 0) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in data ? String(data[key]) : match;
  });
}

export function createTemplate(template: string) {
  if (!template) return () => '';
  return (data: Record<string, string | number | boolean>) => interpolate(template, data);
}

export function escapeTemplate(str: string): string {
  if (!str) return str;
  return str.replace(/\{\{/g, '\\{\\{').replace(/\}\}/g, '\\}\\}');
}
