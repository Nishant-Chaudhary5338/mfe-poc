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
    return false;
  }
}

export function isValidPhone(value: string, _country?: string): boolean {
  if (!value?.trim()) return false;
  return /^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s()-]/g, ''));
}

export function isValidPassword(value: string, rules?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}): boolean {
  if (!value) return false;
  const { minLength = 8, requireUppercase = true, requireNumber = true, requireSpecial = true } = rules ?? {};
  if (value.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(value)) return false;
  if (requireNumber && !/\d/.test(value)) return false;
  if (requireSpecial && !/[!@#$%^&*(),.?\":{}|<>]/.test(value)) return false;
  return true;
}

export function isValidCreditCard(value: string): boolean {
  if (!value?.trim()) return false;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function isValidIpAddress(value: string, version?: 4 | 6): boolean {
  if (!value?.trim()) return false;
  if (version === 4) return REGEX_PATTERNS.IPV4.test(value);
  if (version === 6) return REGEX_PATTERNS.IPV6.test(value);
  return REGEX_PATTERNS.IPV4.test(value) || REGEX_PATTERNS.IPV6.test(value);
}

export function isValidJson(value: string): boolean {
  if (!value?.trim()) return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidHexColor(value: string): boolean {
  if (!value?.trim()) return false;
  return REGEX_PATTERNS.HEX_COLOR.test(value);
}

export function isValidDateString(value: string): boolean {
  if (!value?.trim()) return false;
  return !isNaN(Date.parse(value));
}
