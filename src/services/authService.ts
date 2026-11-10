/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, PLATFORM_OWNER_EMAIL } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserAccount, Company } from '../types/saas';
import { getCompanyById, logAuditAction } from './tenantService';
import {
  checkRateLimit,
  recordFailedLogin,
  resetFailedLogin,
  verifyOwnerMfaCode,
  logSecurityIntrusion
} from './securityService';

export interface AuthSession {
  userAccount: UserAccount | null;
  company: Company | null;
  firebaseUser: FirebaseUser | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// GET CURRENT USER PROFILE & KYC STATUS
// ---------------------------------------------------------------------------
export async function fetchUserAccount(
  firebaseUser: FirebaseUser
): Promise<{ account: UserAccount; company: Company | null }> {
  const userEmail = (firebaseUser.email || '').toLowerCase().trim();
  const isSuperAdmin = userEmail === PLATFORM_OWNER_EMAIL.toLowerCase().trim();

  if (isSuperAdmin) {
    // 1. Super Admin Profile
    const superAdminAccount: UserAccount = {
      uid: firebaseUser.uid,
      email: userEmail,
      displayName: 'Super Admin (Platform Owner)',
      companyId: 'platform',
      role: 'superadmin',
      isCompanyAdmin: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Ensure super admin doc in /admins/{uid} exists
    try {
      await setDoc(doc(db, 'admins', firebaseUser.uid), {
        email: userEmail,
        isSuperAdmin: true,
        assignedAt: new Date().toISOString(),
      }, { merge: true });

      await setDoc(doc(db, 'users', firebaseUser.uid), superAdminAccount, { merge: true });
    } catch (e) {
      console.warn('Super admin doc sync notice:', e);
    }

    return { account: superAdminAccount, company: null };
  }

  // 2. Regular Company User or KYC Applicant Profile
  let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid)).catch(() => null);
  let accountData: UserAccount | null = null;

  if (userDoc?.exists()) {
    accountData = userDoc.data() as UserAccount;
  } else {
    // Check if pre-provisioned user profile exists by email (e.g. invited by admin)
    const q = query(collection(db, 'users'), where('email', '==', userEmail));
    const snap = await getDocs(q).catch(() => null);
    if (snap && !snap.empty) {
      const matchDoc = snap.docs[0];
      accountData = { ...(matchDoc.data() as UserAccount), uid: firebaseUser.uid };
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), accountData, { merge: true });
      } catch (e) {
        console.warn('Sync UID notice:', e);
      }
    }
  }

  // 3. Check if user has an associated KYC application
  let kycStatus: UserAccount['kycStatus'] = undefined;
  let kycAppId: string | undefined = undefined;
  try {
    const kycQuery = query(collection(db, 'kycApplications'), where('userId', '==', firebaseUser.uid));
    const kycSnap = await getDocs(kycQuery);
    if (!kycSnap.empty) {
      const latestKyc = kycSnap.docs[0].data();
      kycStatus = latestKyc.status;
      kycAppId = latestKyc.id;
      if (latestKyc.assignedCompanyId && accountData) {
        accountData.companyId = latestKyc.assignedCompanyId;
      }
    }
  } catch (err) {
    console.warn('KYC check warning:', err);
  }

  if (!accountData) {
    // Brand new applicant without pre-existing record
    accountData = {
      uid: firebaseUser.uid,
      email: userEmail,
      displayName: firebaseUser.displayName || userEmail.split('@')[0],
      companyId: 'pending_kyc',
      role: 'admin',
      isCompanyAdmin: true,
      status: 'active',
      kycStatus: kycStatus || 'draft',
      kycApplicationId: kycAppId,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), accountData, { merge: true });
    } catch (e) {
      console.warn('User init notice:', e);
    }
  } else {
    accountData.kycStatus = kycStatus || accountData.kycStatus;
    accountData.kycApplicationId = kycAppId || accountData.kycApplicationId;
  }

  // Fetch associated company if approved and active
  let company: Company | null = null;
  if (accountData.companyId && accountData.companyId !== 'platform' && accountData.companyId !== 'pending_kyc') {
    company = await getCompanyById(accountData.companyId);
  }

  return { account: accountData, company };
}

// ---------------------------------------------------------------------------
// SIGN IN WITH EMAIL & PASSWORD (CUSTOMER PORTAL)
// ---------------------------------------------------------------------------
export async function loginWithEmail(email: string, pass: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Rate limiting & Lockout guard
  const limit = checkRateLimit(cleanEmail);
  if (limit.isLocked) {
    throw new Error(
      `Akaunti imefungwa kwa muda kutokana na majaribio mengi ya nenosiri yasiyo sahihi. Tafadhali subiri dakika ${limit.remainingMinutes} kabla ya kujaribu tena.`
    );
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    resetFailedLogin(cleanEmail);
    const { account } = await fetchUserAccount(cred.user);
    return account;
  } catch (err: any) {
    // Record failure count
    const attemptResult = recordFailedLogin(cleanEmail);

    if (attemptResult.isLocked) {
      throw new Error(
        'Akaunti imefungwa kwa muda wa dakika 15 kutokana na majaribio 5 yasiyo sahihi. Tafadhali subiri au tumia huduma ya kurejesha nenosiri (Forgot Password).'
      );
    }

    // Generic enterprise error message (never reveals if email exists or not)
    throw new Error('Barua pepe au nenosiri si sahihi. Tafadhali hakiki taarifa zako na ujaribu tena.');
  }
}

// ---------------------------------------------------------------------------
// PLATFORM OWNER LOGIN (SEPARATE /owner-login ROUTE WITH MFA)
// ---------------------------------------------------------------------------
export async function loginPlatformOwner(
  email: string,
  pass: string,
  mfaCode: string
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const requiredOwnerEmail = PLATFORM_OWNER_EMAIL.trim().toLowerCase();

  // Guard 1: Strictest boundary - Only the exact owner email can log in here
  if (cleanEmail !== requiredOwnerEmail) {
    // Log security alert for unauthorized probe of owner portal
    await logSecurityIntrusion(cleanEmail, `Attempt to access owner portal with non-owner email: ${cleanEmail}`);
    throw new Error('Huruhusiwi kuingia kwenye lango hili la kiutawala. Taarifa ya jaribio hili imerekodiwa.');
  }

  // Guard 2: Multi-Factor Authentication code verification
  const isMfaValid = verifyOwnerMfaCode(cleanEmail, mfaCode);
  if (!isMfaValid) {
    throw new Error('Nambari ya uthibitisho ya MFA (Security Code) si sahihi au imepitwa na wakati.');
  }

  // Guard 3: Authenticate with Firebase
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    resetFailedLogin(cleanEmail);

    // Audit log successful owner login
    await logAuditAction(
      'OWNER_AUTHENTICATION_SUCCESS',
      cleanEmail,
      'platform',
      'KaziDesk Platform',
      'Platform owner logged in via /owner-login with MFA verification.'
    );

    const { account } = await fetchUserAccount(cred.user);
    return account;
  } catch (err: any) {
    recordFailedLogin(cleanEmail);
    throw new Error('Barua pepe au nenosiri la mmiliki si sahihi.');
  }
}

// ---------------------------------------------------------------------------
// REGISTER NEW APPLICANT (STEP 1 OF KYC ONBOARDING)
// ---------------------------------------------------------------------------
export async function registerApplicantUser(
  email: string,
  pass: string,
  fullName: string,
  phone: string
): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const now = new Date().toISOString();

  // Send email verification
  try {
    await sendEmailVerification(cred.user);
  } catch (e) {
    console.warn('Email verification send notice:', e);
  }

  // Initialize initial UserAccount in Firestore
  const userAccount: UserAccount = {
    uid: cred.user.uid,
    email: cleanEmail,
    displayName: fullName.trim(),
    companyId: 'pending_kyc',
    role: 'admin',
    isCompanyAdmin: true,
    mustChangePassword: false,
    isOnboarded: false,
    status: 'active',
    kycStatus: 'draft',
    createdAt: now,
  };

  await setDoc(doc(db, 'users', cred.user.uid), userAccount, { merge: true });

  return cred.user;
}

// ---------------------------------------------------------------------------
// RESEND EMAIL VERIFICATION
// ---------------------------------------------------------------------------
export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

// ---------------------------------------------------------------------------
// SIGN OUT (CLEARS ALL SESSION CACHES & IN-MEMORY STATE)
// ---------------------------------------------------------------------------
export async function logoutUser(): Promise<void> {
  try {
    // Clear all session and temporary data
    sessionStorage.clear();
    localStorage.removeItem('kazidesk_active_tab');
  } catch {
    // Ignore storage clear issues
  }
  await firebaseSignOut(auth);
}

// ---------------------------------------------------------------------------
// PASSWORD RESET
// ---------------------------------------------------------------------------
export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
export async function updateUserPassword(newPass: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Hakuna mtumiaji aliyeingia');
  await firebaseUpdatePassword(auth.currentUser, newPass);

  // Clear mustChangePassword flag in Firestore
  await updateDoc(doc(db, 'users', auth.currentUser.uid), {
    mustChangePassword: false,
  });
}
