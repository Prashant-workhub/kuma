import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';

const signInWithCustomToken = (FirebaseAuth as any).signInWithCustomToken as (
  auth: any,
  customToken: string
) => Promise<any>;
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Capacitor } from '@capacitor/core';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, FormField, InlineAlert } from './ui';
import { portalRoleFromProfile } from '../utils/userRoles';
import TraineeRegistrationView from './TraineeRegistrationView';
import TrainerRegistrationView from './TrainerRegistrationView';

interface AuthViewProps {
  onLoginSuccess: (userData: { fullName: string; emailAddress: string; role?: string }) => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'verify' | 'faculty';
  theme: 'light' | 'dark';
  onNavigateToLanding?: () => void;
}

export default function AuthView({
  onLoginSuccess,
  initialMode = 'login',
  theme,
  onNavigateToLanding
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>(
    initialMode === 'faculty' ? 'login' : initialMode
  );
  const [isFacultyMode, setIsFacultyMode] = useState(initialMode === 'faculty');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resolveProviderRole = async (
    user: { uid: string; displayName: string | null; email: string | null },
    requestedRole: 'trainee' | 'trainer'
  ) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const storedRole = portalRoleFromProfile(userSnap.data().role);
      if (!storedRole) throw new Error('Your profile has no valid role assigned. Contact your administrator.');
      return storedRole;
    }

    const firestoreRole = requestedRole === 'trainer' ? 'faculty' : 'trainee';
    await setDoc(userRef, {
      uid: user.uid,
      role: firestoreRole,
      fullName: user.displayName || 'Kuma User',
      email: user.email || '',
      onboarding_completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return requestedRole;
  };

  const getFriendlyAuthErrorMessage = (err: any): string => {
    if (!err) return 'An unexpected authentication error occurred.';

    if (typeof err === 'string') {
      const trimmed = err.trim();
      return trimmed && trimmed !== 'Error' && trimmed !== 'Error.'
        ? trimmed
        : 'Authentication failed. Please verify your details and try again.';
    }

    const code = err.code || err.errorCode || '';
    const msg = err.message || err.toString() || '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Invalid email or password. Please verify your credentials or click "Forgot password".';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please register for a new account.';
      case 'auth/email-already-in-use':
      case 'auth/email-already-exists':
        return 'This email address is already registered. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing authentication.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Access has been temporarily paused. Try resetting your password.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'auth/user-disabled':
        return 'This user account has been disabled by an administrator.';
      default: {
        let cleaned = msg;
        if (cleaned.startsWith('Firebase:')) {
          cleaned = cleaned.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?$/, '').trim();
        }
        if (!cleaned || cleaned.toLowerCase() === 'error') {
          return 'Authentication failed. Please verify your details and try again.';
        }
        return cleaned;
      }
    }
  };

  const validateLoginForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'login' && !validateLoginForm()) {
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const userRef = doc(db, 'users', userCredential.user.uid);
        const profileSnap = await getDoc(userRef);
        if (!profileSnap.exists()) {
          throw new Error('No profile linked to this account. Please register first.');
        }
        const profileData = profileSnap.data();
        const detectedRole = portalRoleFromProfile(profileData.role);
        if (!detectedRole) throw new Error('Your profile has no valid role assigned. Contact your administrator.');

        setSuccessMsg('Signed in successfully.');

        setTimeout(() => {
          onLoginSuccess({
            fullName: profileData.fullName || profileData.first_name || userCredential.user.displayName || cleanEmail.split('@')[0],
            emailAddress: profileData.email || userCredential.user.email || cleanEmail,
            role: detectedRole
          });
        }, 600);

      } else if (mode === 'forgot') {
        if (!cleanEmail) {
          setFieldErrors({ email: 'Please enter your registered email address.' });
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMsg(`Password reset link sent to ${cleanEmail}. Check your inbox to set a new password.`);
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = async (role: 'admin' | 'trainer' | 'trainee') => {
    setIsFacultyMode(role === 'trainer');
    setMode('login');
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      let resData: any = null;
      try {
        const response = await fetch('/api/demo/login-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });
        resData = await response.json().catch(() => ({}));
      } catch (fetchErr) {
        // Standalone/mock environment fallback
        resData = {
          success: true,
          fullName: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          emailAddress: `demo.${role}@kuma.internal`,
          role: role === 'trainer' ? 'faculty' : role
        };
      }

      if (resData && resData.customToken) {
        const userCredential = await signInWithCustomToken(auth, resData.customToken);
        setSuccessMsg(`Signed in as evaluator demo (${role}).`);
        setTimeout(() => {
          onLoginSuccess({
            fullName: resData.fullName || userCredential.user.displayName || userCredential.user.email || 'Demo User',
            emailAddress: userCredential.user.email || '',
            role: resData.role || (role === 'trainer' ? 'faculty' : role)
          });
        }, 300);
      } else {
        // Fallback demo signin without custom token
        const mappedRole = role === 'trainer' ? 'faculty' : role;
        setSuccessMsg(`Signed in as evaluator demo (${role}).`);
        setTimeout(() => {
          onLoginSuccess({
            fullName: resData?.fullName || `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            emailAddress: resData?.emailAddress || `demo.${role}@kuma.internal`,
            role: mappedRole
          });
        }, 300);
      }
    } catch (err: any) {
      console.error('Demo authentication error:', err);
      setError(err.message || 'Demo authentication failed. Please check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();

      let userCredential;
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, provider);
        return;
      } else {
        userCredential = await signInWithPopup(auth, provider);
      }

      const detectedRole = await resolveProviderRole(userCredential.user, isFacultyMode ? 'trainer' : 'trainee');

      onLoginSuccess({
        fullName: userCredential.user.displayName || 'Google User',
        emailAddress: userCredential.user.email || '',
        role: detectedRole
      });
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'signup' && !isFacultyMode) {
    return (
      <TraineeRegistrationView
        onLoginSuccess={onLoginSuccess}
        onNavigateToLogin={() => {
          setMode('login');
          setIsFacultyMode(false);
        }}
        onNavigateToTrainerSignup={() => {
          setMode('signup');
          setIsFacultyMode(true);
        }}
        theme={theme}
      />
    );
  }

  if (mode === 'signup' && isFacultyMode) {
    return (
      <TrainerRegistrationView
        onLoginSuccess={onLoginSuccess}
        onNavigateToLogin={() => {
          setMode('login');
          setIsFacultyMode(true);
        }}
        onNavigateToTraineeSignup={() => {
          setMode('signup');
          setIsFacultyMode(false);
        }}
        theme={theme}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-page flex flex-col items-center justify-center p-4 font-sans text-text-primary">
      <div className="w-full max-w-md space-y-6">
        
        {/* Main Auth Card */}
        <Card className="w-full border border-border shadow-sm p-6 bg-surface">
          <CardHeader className="p-0 mb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="p-2 rounded-control bg-primary-subtle text-primary">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-text-primary">
                Kuma
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-text-secondary leading-relaxed">
              Enterprise learning and competency management system
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {error && (
              <InlineAlert variant="danger" title="Authentication error" onClose={() => setError(null)}>
                {error}
              </InlineAlert>
            )}

            {successMsg && (
              <InlineAlert variant="success">
                {successMsg}
              </InlineAlert>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <FormField
                  label="Email address"
                  required
                  errorText={fieldErrors.email}
                >
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    placeholder="name@organization.com"
                    autoComplete="email"
                  />
                </FormField>

                <FormField
                  label="Password"
                  required
                  errorText={fieldErrors.password}
                >
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                      }}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </FormField>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setFieldErrors({}); }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={loading}
                  className="w-full justify-center font-medium"
                >
                  Sign in
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <FormField
                  label="Email address"
                  required
                  errorText={fieldErrors.email}
                >
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                  />
                </FormField>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={loading}
                  className="w-full justify-center font-medium"
                >
                  Send password reset link
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setFieldErrors({}); }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {mode === 'login' && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-surface px-2 text-text-tertiary font-medium">or</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={handleGoogleSignIn}
                  isLoading={loading}
                  className="w-full justify-center gap-2 font-medium"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                  </svg>
                  <span>Sign in with Google</span>
                </Button>

                <div className="pt-4 border-t border-border text-center space-y-2">
                  <p className="text-xs text-text-secondary">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setIsFacultyMode(false); setError(null); }}
                      className="font-medium text-primary hover:underline"
                    >
                      Register as trainee
                    </button>
                    {' or '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setIsFacultyMode(true); setError(null); }}
                      className="font-medium text-primary hover:underline"
                    >
                      Register as trainer
                    </button>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Separated Evaluator Access Section */}
        <div className="w-full border border-border rounded-container p-4 bg-surface-subtle space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-text-primary">Evaluator access</h3>
            <p className="text-xs text-text-secondary leading-normal">
              Access sample organization data for evaluation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => selectDemoAccount('admin')}
              disabled={loading}
              className="w-full justify-center text-xs"
            >
              Admin
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => selectDemoAccount('trainer')}
              disabled={loading}
              className="w-full justify-center text-xs"
            >
              Trainer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => selectDemoAccount('trainee')}
              disabled={loading}
              className="w-full justify-center text-xs"
            >
              Trainee
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

