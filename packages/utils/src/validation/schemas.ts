import { z } from 'zod';

// ============================================
// Schema Builders
// ============================================

export function zodEmail(message = 'Invalid email address') {
  return z.string().email(message);
}

export function zodPassword(options: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  message?: string;
} = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true,
    message = 'Password does not meet requirements',
  } = options;

  let schema = z.string().min(minLength, `Password must be at least ${minLength} characters`);

  if (requireUppercase) {
    schema = schema.regex(/[A-Z]/, 'Password must contain at least one uppercase letter');
  }
  if (requireLowercase) {
    schema = schema.regex(/[a-z]/, 'Password must contain at least one lowercase letter');
  }
  if (requireNumber) {
    schema = schema.regex(/\d/, 'Password must contain at least one number');
  }
  if (requireSpecial) {
    schema = schema.regex(/[!@#$%^&*(),.?\":{}|<>]/, 'Password must contain at least one special character');
  }

  return schema;
}

export function zodPhone(options: { country?: string; message?: string } = {}) {
  const { message = 'Invalid phone number' } = options;
  return z.string().regex(/^\+?[1-9]\d{1,14}$/, message);
}

export function zodUrl(message = 'Invalid URL') {
  return z.string().url(message);
}

export function zodUuid(message = 'Invalid UUID') {
  return z.string().uuid(message);
}

export function zodDateString(message = 'Invalid date') {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}/, message);
}

export function zodIpAddress(message = 'Invalid IP address') {
  return z.string().ip(message);
}

export function zodCreditCard(message = 'Invalid credit card number') {
  return z.string().regex(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/, message);
}

export function zodSlug(message = 'Invalid slug') {
  return z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, message);
}

export function zodUsername(message = 'Invalid username') {
  return z.string().regex(/^[a-zA-Z0-9_-]{3,20}$/, message);
}
