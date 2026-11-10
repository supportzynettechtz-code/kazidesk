/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from './config';
import { doc, setDoc } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FriendlyErrorMessage {
  sw: string;
  en: string;
  isConfigurationError?: boolean;
  field?: 'email' | 'password' | 'phone' | 'terms' | 'general';
}

/**
 * Log technical diagnostic to admin auditLogs silently so platform owner sees it in portal.
 * NEVER outputs raw error stack to browser console in production.
 */
export async function logAdminDiagnostic(
  action: string,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const logId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await setDoc(doc(db, 'auditLogs', logId), {
      id: logId,
      action,
      actorEmail: auth.currentUser?.email || 'system@kazidesk.com',
      actorUid: auth.currentUser?.uid || 'system',
      timestamp: new Date().toISOString(),
      details,
      metadata: metadata || {},
    }, { merge: true });
  } catch {
    // Fail silently to avoid user disturbance
  }
}

/**
 * Converts any Firebase Auth error code into friendly bilingual messages.
 * Logs diagnostic to admin portal if configuration issue (like auth/operation-not-allowed).
 */
export function mapFirebaseAuthError(error: unknown, contextEmail?: string): FriendlyErrorMessage {
  const errCode = (error && typeof error === 'object' && 'code' in error)
    ? String((error as any).code)
    : String(error || '');

  // 1. Operation Not Allowed (Email/Password disabled in Firebase console)
  if (errCode.includes('auth/operation-not-allowed') || errCode.includes('operation-not-allowed')) {
    logAdminDiagnostic(
      'DIAGNOSTIC_AUTH_CONFIGURATION_ERROR',
      `Firebase Authentication failure: Email/Password sign-in provider is disabled in Firebase Console. Affected user: ${contextEmail || 'unknown'}`,
      { code: 'auth/operation-not-allowed', contextEmail }
    );

    return {
      sw: 'Usajili na huduma ya kuingia haipatikani kwa muda. Tafadhali wasiliana na huduma kwa wateja (WhatsApp: +255775740386 au Barua Pepe: support.zynettechtz@gmail.com).',
      en: 'Registration is temporarily unavailable, please contact support (WhatsApp: +255775740386 or Email: support.zynettechtz@gmail.com).',
      isConfigurationError: true,
      field: 'general'
    };
  }

  // 2. Email Already in Use
  if (errCode.includes('auth/email-already-in-use') || errCode.includes('email-already-in-use')) {
    return {
      sw: 'Barua pepe hii imeshawahi kusajiliwa. Tafadhali ingia kwenye akaunti yako au tumia huduma ya kusahau nenosiri.',
      en: 'This email is already registered. Please sign in or reset your password instead.',
      field: 'email'
    };
  }

  // 3. Weak Password
  if (errCode.includes('auth/weak-password') || errCode.includes('weak-password')) {
    return {
      sw: 'Nenosiri ni dhaifu. Linatakiwa kuwa na angalau herufi 10 likijumuisha herufi kubwa, ndogo, namba na alama.',
      en: 'Password is too weak. It must be at least 10 characters long with uppercase, lowercase, numbers, and symbols.',
      field: 'password'
    };
  }

  // 4. Invalid Email
  if (errCode.includes('auth/invalid-email') || errCode.includes('invalid-email')) {
    return {
      sw: 'Muundo wa barua pepe si sahihi. Tafadhali weka barua pepe kamili (mfano: jina@kampuni.co.tz).',
      en: 'Invalid email address format. Please provide a valid work email.',
      field: 'email'
    };
  }

  // 5. Network Request Failed
  if (errCode.includes('auth/network-request-failed') || errCode.includes('network-request-failed')) {
    return {
      sw: 'Muunganisho wa intaneti umeshindwa. Tafadhali hakiki intaneti yako kisha ujaribu tena.',
      en: 'Network connection failed. Please verify your internet connection and try again.',
      field: 'general'
    };
  }

  // 6. Too Many Requests (Rate limit)
  if (errCode.includes('auth/too-many-requests') || errCode.includes('too-many-requests')) {
    return {
      sw: 'Majaribio mengi yamefanyika kwa muda mfupi. Tafadhali subiri dakika chache kabla ya kujaribu tena.',
      en: 'Too many requests. Please wait a few moments before trying again.',
      field: 'general'
    };
  }

  // 7. Permission Denied
  if (errCode.includes('permission-denied') || errCode.includes('insufficient-permission')) {
    return {
      sw: 'Huna ruhusa ya kufanya kitendo hiki kwa sasa. Tafadhali hakiki taarifa zako.',
      en: 'Access denied. You do not have permission to perform this action.',
      field: 'general'
    };
  }

  // 8. User Not Found or Wrong Password
  if (errCode.includes('auth/wrong-password') || errCode.includes('auth/user-not-found') || errCode.includes('auth/invalid-credential')) {
    return {
      sw: 'Barua pepe au nenosiri si sahihi. Tafadhali hakiki taarifa zako na ujaribu tena.',
      en: 'Invalid email or password. Please verify your credentials and try again.',
      field: 'password'
    };
  }

  // Generic Fallback
  return {
    sw: 'Imeshindikana kukamilisha ombi lako kwa sasa. Tafadhali hakiki taarifa zako kisha ujaribu tena.',
    en: 'Unable to process your request at this time. Please verify your details and try again.',
    field: 'general'
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuthUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid,
      email: currentAuthUser?.email,
      emailVerified: currentAuthUser?.emailVerified,
      isAnonymous: currentAuthUser?.isAnonymous,
      tenantId: currentAuthUser?.tenantId,
      providerInfo: currentAuthUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  // Silently record to auditLogs without polluting client browser console
  logAdminDiagnostic(
    `FIRESTORE_ERROR_${operationType.toUpperCase()}`,
    `Path: ${path || 'unknown'} - Error: ${errInfo.error}`,
    { path, operationType }
  );

  throw new Error(JSON.stringify(errInfo));
}
