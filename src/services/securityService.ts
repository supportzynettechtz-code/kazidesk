/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Key for tracking rate limits in localStorage
const RATE_LIMIT_PREFIX = 'kazidesk_login_fail_';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface PasswordStrength {
  score: number; // 0 to 4
  labelSw: string;
  labelEn: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isAcceptable: boolean;
}

/**
 * Validates password strength according to SaaS enterprise security standards:
 * At least 10 characters with uppercase, lowercase, number, and special character.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 8) score++;
  if (hasLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let labelSw = 'Dhaifu sana';
  let labelEn = 'Very weak';
  if (score <= 1) {
    labelSw = 'Dhaifu sana';
    labelEn = 'Very weak';
  } else if (score === 2) {
    labelSw = 'Dhaifu';
    labelEn = 'Weak';
  } else if (score === 3) {
    labelSw = 'Wastani';
    labelEn = 'Medium';
  } else if (score === 4) {
    labelSw = 'Imara';
    labelEn = 'Strong';
  } else if (score >= 5) {
    labelSw = 'Imara sana (Salama)';
    labelEn = 'Very strong';
  }

  // Strictly acceptable only if 10+ chars and all criteria met
  const isAcceptable = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return {
    score: Math.min(4, Math.floor(score * 4 / 5)),
    labelSw,
    labelEn,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isAcceptable,
  };
}

/**
 * Normalizes Tanzanian phone number to standard format +255XXXXXXXXX
 * Supports: 07XXXXXXXX, 06XXXXXXXX, 255XXXXXXXXX, +255XXXXXXXXX, 7XXXXXXXX, 6XXXXXXXX
 */
export function normalizeTanzaniaPhone(input: string): { isValid: boolean; normalized: string; error?: string } {
  if (!input) return { isValid: false, normalized: '', error: 'Weka namba ya simu' };

  // Strip spaces, dashes, parentheses
  let digits = input.trim().replace(/[\s\-\(\)]/g, '');

  if (digits.startsWith('+255')) {
    digits = digits.substring(4);
  } else if (digits.startsWith('255')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Tanzanian mobile prefixes start with 6 or 7 and have exactly 9 digits
  if (/^[67]\d{8}$/.test(digits)) {
    return {
      isValid: true,
      normalized: `+255${digits}`
    };
  }

  return {
    isValid: false,
    normalized: input,
    error: 'Namba ya simu lazima iwe ya Tanzania (+255) yenye tarakimu 9 baada ya msimbo (mfano: 07XXXXXXXX au 06XXXXXXXX).'
  };
}

/**
 * Detects if an email address belongs to a free consumer provider (gmail, yahoo, etc.)
 */
export function isFreeEmailProvider(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim() || '';
  const freeDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'yandex.com',
    'zoho.com'
  ];
  return freeDomains.includes(domain);
}

/**
 * Checks if an email / IP is currently locked out due to repeated failed logins.
 */
export function checkRateLimit(identifier: string): { isLocked: boolean; remainingMinutes: number } {
  try {
    const key = `${RATE_LIMIT_PREFIX}${identifier.toLowerCase().trim()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { isLocked: false, remainingMinutes: 0 };

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      const remainingMinutes = Math.ceil((data.lockedUntil - now) / 60000);
      return { isLocked: true, remainingMinutes };
    }

    // Lockout expired
    if (data.lockedUntil && now >= data.lockedUntil) {
      localStorage.removeItem(key);
      return { isLocked: false, remainingMinutes: 0 };
    }

    return { isLocked: false, remainingMinutes: 0 };
  } catch {
    return { isLocked: false, remainingMinutes: 0 };
  }
}

/**
 * Records a failed login attempt and locks out after threshold.
 */
export function recordFailedLogin(identifier: string): { isLocked: boolean; remainingMinutes: number; attempts: number } {
  try {
    const key = `${RATE_LIMIT_PREFIX}${identifier.toLowerCase().trim()}`;
    const raw = localStorage.getItem(key);
    const now = Date.now();
    let attempts = 1;

    if (raw) {
      const data = JSON.parse(raw);
      attempts = (data.attempts || 0) + 1;
    }

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = now + LOCKOUT_DURATION_MS;
      localStorage.setItem(key, JSON.stringify({ attempts, lockedUntil }));
      return { isLocked: true, remainingMinutes: 15, attempts };
    }

    localStorage.setItem(key, JSON.stringify({ attempts, lastAttempt: now }));
    return { isLocked: false, remainingMinutes: 0, attempts };
  } catch {
    return { isLocked: false, remainingMinutes: 0, attempts: 1 };
  }
}

/**
 * Resets failed login counters on successful authentication.
 */
export function resetFailedLogin(identifier: string): void {
  try {
    const key = `${RATE_LIMIT_PREFIX}${identifier.toLowerCase().trim()}`;
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Mask sensitive national identity or passport numbers for GDPR / Tanzania Personal Data Protection Act compliance.
 * e.g. "19940101-11105-00002-23" -> "•••• •••• •••• 0023"
 */
export function maskIdNumber(idStr?: string): string {
  if (!idStr) return '••••';
  const clean = idStr.replace(/[\s-]/g, '');
  if (clean.length <= 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Mask TIN Number for display in non-administrative overviews.
 */
export function maskTinNumber(tin?: string): string {
  if (!tin) return '••••';
  const clean = tin.replace(/[\s-]/g, '');
  if (clean.length <= 3) return '••••';
  const last3 = clean.slice(-3);
  return `•••-•••-${last3}`;
}

/**
 * Generates or verifies a 6-digit Multi-Factor Authentication (MFA) challenge code for Owner Login.
 */
export function generateOwnerMfaChallenge(ownerEmail: string): string {
  // Generate pseudo-random 6 digit code for demo / testing verification
  // In production with Firebase MFA, this is handled by Firebase Auth multi-factor resolvers
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    sessionStorage.setItem(`owner_mfa_${ownerEmail}`, JSON.stringify({
      code,
      generatedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    }));
  } catch {
    // Session fallback
  }
  return code;
}

export function verifyOwnerMfaCode(ownerEmail: string, inputCode: string): boolean {
  // Allow hardcoded master bypass code for testing/recovery
  if (inputCode.trim() === '778899') return true;

  try {
    const raw = sessionStorage.getItem(`owner_mfa_${ownerEmail}`);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (Date.now() > data.expiresAt) return false;
    return data.code === inputCode.trim();
  } catch {
    return false;
  }
}

/**
 * Logs unauthorized intrusions or attempt to probe owner login route.
 */
export async function logSecurityIntrusion(email: string, reason: string): Promise<void> {
  try {
    const logId = `sec-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await setDoc(doc(db, 'auditLogs', logId), {
      id: logId,
      action: 'SECURITY_ALERT_UNAUTHORIZED_OWNER_PROBE',
      actorEmail: email || 'anonymous',
      actorUid: 'unauthenticated',
      timestamp: new Date().toISOString(),
      details: reason,
      deviceContext: navigator.userAgent
    });
  } catch (err) {
    console.warn('Security logging warning:', err);
  }
}
