import { z } from 'zod';
import type { ZodSchema } from 'zod';

export interface FormFieldConfig {
  type: 'string' | 'number' | 'boolean' | 'email' | 'password' | 'phone' | 'url' | 'uuid' | 'date' | 'enum';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  values?: (string | number)[];
  message?: string;
}

export function createFormSchema(fields: Record<string, FormFieldConfig>): ZodSchema {
  const shape: Record<string, ZodSchema> = {};

  for (const [key, config] of Object.entries(fields)) {
    let fieldSchema: ZodSchema;

    switch (config.type) {
      case 'email':
        fieldSchema = z.string().email(config.message ?? 'Invalid email');
        break;
      case 'password': {
        let s = z.string();
        if (config.minLength) s = s.min(config.minLength);
        s = s.regex(/[A-Z]/, 'Must contain uppercase').regex(/\d/, 'Must contain number');
        fieldSchema = s;
        break;
      }
      case 'phone':
        fieldSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, config.message ?? 'Invalid phone');
        break;
      case 'url':
        fieldSchema = z.string().url(config.message ?? 'Invalid URL');
        break;
      case 'uuid':
        fieldSchema = z.string().uuid(config.message ?? 'Invalid UUID');
        break;
      case 'date':
        fieldSchema = z.string().or(z.date());
        break;
      case 'number': {
        let numSchema = z.number();
        if (config.min !== undefined) numSchema = numSchema.min(config.min);
        if (config.max !== undefined) numSchema = numSchema.max(config.max);
        fieldSchema = numSchema;
        break;
      }
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'enum':
        if (config.values) {
          fieldSchema = z.enum(config.values as [string, ...string[]]);
        } else {
          fieldSchema = z.string();
        }
        break;
      case 'string':
      default: {
        let strSchema = z.string();
        if (config.minLength) strSchema = strSchema.min(config.minLength);
        if (config.maxLength) strSchema = strSchema.max(config.maxLength);
        if (config.pattern) strSchema = strSchema.regex(config.pattern, config.message ?? 'Invalid format');
        fieldSchema = strSchema;
        break;
      }
    }

    if (!config.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[key] = fieldSchema;
  }

  return z.object(shape);
}

export function validateField<T>(value: T, schema: ZodSchema<T>): { success: boolean; error?: string } {
  const result = schema.safeParse(value);
  if (result.success) return { success: true };
  return { success: false, error: result.error.errors[0]?.message ?? 'Validation failed' };
}

export function sanitizeInput(value: string): string {
  if (!value) return '';
  return value
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateFileUpload(
  file: { size: number; type: string },
  rules: { maxSize?: number; allowedTypes?: string[] }
): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No file provided' };
  if (rules.maxSize && file.size > rules.maxSize) {
    return { valid: false, error: `File size exceeds ${rules.maxSize} bytes` };
  }
  if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  return { valid: true };
}
