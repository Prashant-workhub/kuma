/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageIdToPath, pathToPageId } from './routes';
import { onAuthStateChanged, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { isNetworkAvailable } from './config';
import {
  GraduationCap, 
  Sparkles, 
  Compass, 
  BookMarked, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Brain,
  Cpu,
  FileCode,
  CheckCircle,
  Star
} from 'lucide-react';

// Types and mock imports
import { PageId, Source, Lecture, NotificationItem, UserSettings, Note, DoubtItem, Quiz, QuizAttemptRecord, CompetencyAttemptHistoryItem, CatalogCompetency, TraineeCompetency } from './types';
import { useNotes } from './hooks/useNotes';
import { 
  INITIAL_SOURCES, 
  INITIAL_LECTURES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SETTINGS,
  INITIAL_QUIZZES,
  INITIAL_COMPETENCY_CATALOG
} from './data';
import { updateEnrollmentProgress } from './utils/enrollmentUtils';
import { COURSES } from './teacher-portal/lib/mockData';

// Component imports
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import SupportView from './components/SupportView';
import PricingView from './components/PricingView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import SkillGapView from './components/SkillGapView';
import CertificatesView from './components/CertificatesView';
import CertificateVerificationView from './components/CertificateVerificationView';
import LandingView from './components/LandingView';
import OnboardingView from './components/OnboardingView';
import BruteLoader from './components/BruteLoader';
import ErrorBoundary from './components/ErrorBoundary';
import FeedbackWidget from './components/FeedbackWidget';
import AssessmentTakingModal from './components/AssessmentTakingModal';
import AILogo from './components/AILogo';
import GuidedTour from './components/GuidedTour';
import NotificationPermissionBanner from './components/NotificationPermissionBanner';
import { setupForegroundMessageListener, requestNotificationPermission } from './services/notificationService';

// Faculty & Admin Portal Imports
import { subscribeFacultyDoubts, generateTeacherCode } from './services/teacherDoubtService';
import FacultyOnboardingView from './components/faculty/FacultyOnboardingView';
import TeacherPortalApp from './teacher-portal/TeacherPortalApp';
import AdminPortalApp from './admin/AdminPortalApp';


export default function App() {
  // Network connectivity state (critical for mobile users)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic connectivity probe for mobile WebViews (navigator.onLine can be unreliable)
  useEffect(() => {
    const probe = async () => {
      const available = await isNetworkAvailable();
      setIsOnline(prev => prev !== available ? available : prev);
    };
    const interval = setInterval(probe, 30000);
    probe(); // Run once on mount
    return () => clearInterval(interval);
  }, []);

  // Live global recording state across tabs
  const [globalRecordingState, setGlobalRecordingState] = useState<{
    isRecording: boolean;
    isPaused: boolean;
    seconds: number;
    pauseCapture: () => void;
    stopCapture: () => void;
  } | null>(null);
  
  // Theme state defaulting to dark for premium dark blue academic vibes
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kuma_theme') as 'light' | 'dark';
      if (saved) return saved;
    }
    return 'dark';
  });

  // Sync theme attribute on <html> element & persist in localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kuma_theme', theme);
  }, [theme]);

  // Persist theme preference in localStorage

  // Authenticated user session state & Role state
  const [sessionUser, setSessionUser] = useState<{ uid: string; fullName: string; emailAddress: string } | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);

  // Onboarding checks
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Guided Tour State & Event Listeners
  const [isGuidedTourOpen, setIsGuidedTourOpen] = useState(false);

  // Service Worker Notification Click Navigation & Foreground Push Message Listener
  useEffect(() => {
    if (typeof window === 'undefined' || !('navigator' in window)) return;
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'KUMA_NOTIFICATION_NAVIGATE') {
        const r = (event.data.route || '').toLowerCase().trim();
        if (r.includes('skill') || r.includes('gap')) setActivePage('skill-gap');
        else if (r.includes('setting')) setActivePage('settings');
        else setActivePage('dashboard');
      }
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    const unsubForeground = setupForegroundMessageListener();
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      unsubForeground();
    };
  }, []);

  // Auto-sync real FCM token when user is authenticated & notification permission is granted
  useEffect(() => {
    if (sessionUser?.uid && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      requestNotificationPermission(sessionUser.uid).catch((err) => {
        console.warn('[App] Auto FCM token sync warning:', err);
      });
    }
  }, [sessionUser?.uid]);

  // Listen for manual Guided Tour start triggers
  useEffect(() => {
    const handleStartTour = () => setIsGuidedTourOpen(true);
    window.addEventListener('kuma_start_guided_tour', handleStartTour);
    return () => window.removeEventListener('kuma_start_guided_tour', handleStartTour);
  }, []);

  // Auto-trigger Guided Tour for new users upon login & onboarding completion
  useEffect(() => {
    if (sessionUser && userRole === 'student' && !isOnboarding) {
      const tourCompleted = localStorage.getItem('kuma_guided_tour_completed');
      if (tourCompleted !== 'true') {
        const timer = setTimeout(() => {
          setIsGuidedTourOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [sessionUser, userRole, isOnboarding]);

  // Real-time listener for doubts collection
  useEffect(() => {
    if (!sessionUser) {
      setDoubts([]);
      return;
    }
    return subscribeFacultyDoubts(sessionUser.uid, (list) => {
      setDoubts(list);
    });
  }, [sessionUser]);

  // Hook up Firestore notes in real-time
  const { notes, isLoading: notesLoading, error: notesError, addNote, updateNote, deleteNote } = useNotes(sessionUser?.uid);

  // Setup Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const loggedUser = {
          uid: user.uid,
          fullName: user.displayName || (sessionUser?.fullName && !sessionUser.fullName.includes('@') ? sessionUser.fullName : (user.email?.split('@')[0] || 'Academic Scholar')),
          emailAddress: user.email || ''
        };
        
        try {
          console.log("Checking onboarding status for user UID:", user.uid);
          const userDocRef = doc(db, 'users', user.uid);
          
          // Race getDoc against a 5-second timeout to prevent infinite loading screens on connectivity/websocket hangs
          const userDocSnap = await Promise.race([
            getDoc(userDocRef),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout fetching user document from Firestore.')), 5000)
            )
          ]);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log("User data loaded from Firestore database:", data);
            
            const isCompleted = !!data.onboarding_completed;
            const rawRole = (data.role || '').toLowerCase();
            const userEmail = (loggedUser.emailAddress || '').toLowerCase();
            
            let detectedRole: 'student' | 'faculty' | 'admin' = 'student';
            if (rawRole === 'admin' || userEmail === 'admin@acme.com' || userEmail.includes('admin')) {
              detectedRole = 'admin';
            } else if (rawRole === 'faculty' || rawRole === 'teacher' || rawRole === 'trainer' || userEmail.includes('trainer')) {
              detectedRole = 'faculty';
            }
            setUserRole(detectedRole);

            const calculatedCode = detectedRole === 'faculty'
              ? (data.teacherCode || generateTeacherCode(`${data.first_name || ''} ${data.last_name || ''}`.trim() || loggedUser.fullName))
              : undefined;

            // Load AI credentials from database into localStorage for instant API usage
            if (data.ai_provider) {
              localStorage.setItem('kuma_active_ai_provider', data.ai_provider);
            }
            if (data.selected_model) {
              localStorage.setItem('kuma_active_ai_model', data.selected_model);
            }
            if (data.api_key) {
              localStorage.setItem('kuma_user_api_key', data.api_key);
              if (data.ai_provider) {
                localStorage.setItem(`kuma_user_api_key_${data.ai_provider}`, data.api_key);
              }
            }

            const isDemoUser = user.uid === 'user-demo-1' || userEmail === 'aarav.sharma@capacityconnect.in' || userEmail === 'guest.student@kuma.ai';
            const fullNameFromDb = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.fullName || loggedUser.fullName;

            // Cleanly parse user skills, competencies, and certifications without polluting real accounts with demo data
            let parsedSkills = Array.isArray(data.skills)
              ? data.skills.map((s: any, idx: number) => typeof s === 'string' ? { id: `sk-${idx}`, name: s, level: 'Intermediate' as const } : s)
              : (isDemoUser ? (INITIAL_SETTINGS.profile.skills || []) : []);

            let parsedCompetencies = Array.isArray(data.competencies)
              ? data.competencies
              : (isDemoUser ? (INITIAL_SETTINGS.profile.competencies || []) : []);

            let parsedCertifications = Array.isArray(data.certifications)
              ? data.certifications
              : (isDemoUser ? (INITIAL_SETTINGS.profile.certifications || []) : []);

            setSettings({
              profile: {
                uid: user.uid,
                fullName: fullNameFromDb,
                firstName: data.first_name || fullNameFromDb.split(' ')[0] || '',
                lastName: data.last_name || fullNameFromDb.split(' ').slice(1).join(' ') || '',
                emailAddress: data.email || loggedUser.emailAddress,
                bio: data.bio !== undefined ? data.bio : (isDemoUser ? INITIAL_SETTINGS.profile.bio : ''),
                avatarUrl: data.profile_image_url || data.avatarUrl || '',
                institution: data.organization || data.school_or_university || (isDemoUser ? INITIAL_SETTINGS.profile.institution : ''),
                role: detectedRole,
                organization: data.organization !== undefined ? data.organization : (isDemoUser ? INITIAL_SETTINGS.profile.organization : ''),
                department: data.department !== undefined ? data.department : (isDemoUser ? INITIAL_SETTINGS.profile.department : ''),
                designation: data.designation !== undefined ? data.designation : (isDemoUser ? INITIAL_SETTINGS.profile.designation : ''),
                yearsOfExperience: data.experienceYears !== undefined ? data.experienceYears : (data.yearsOfExperience !== undefined ? data.yearsOfExperience : (isDemoUser ? INITIAL_SETTINGS.profile.yearsOfExperience : 0)),
                qualification: data.qualification || '',
                degree: data.qualification || '',
                skills: parsedSkills,
                competencies: parsedCompetencies,
                certifications: parsedCertifications,
                countryCode: data.country_code || '',
                phoneNumber: data.phone || data.phone_number || '',
                onboardingCompleted: isCompleted,
                teacherCode: calculatedCode
              },
              subscription: data.subscription ? data.subscription : INITIAL_SETTINGS.subscription,
              integrations: INITIAL_SETTINGS.integrations,
              aiLevels: INITIAL_SETTINGS.aiLevels
            });
            setSessionUser({
              ...loggedUser,
              fullName: fullNameFromDb
            });

            if (detectedRole === 'admin') {
              setIsOnboarding(false);
              setActivePage('admin-dashboard');
            } else if (detectedRole === 'faculty') {
              setIsOnboarding(false);
              setActivePage('faculty-dashboard');
            } else {
              setIsOnboarding(false);
              setActivePage('dashboard');
            }
          } else {
            setSessionUser(loggedUser);
            setIsOnboarding(false);
            setActivePage('dashboard');
          }
        } catch (err: any) {
          console.error("Error checking user status:", err);
          setSessionUser(loggedUser);
          setIsOnboarding(false);
          setActivePage('dashboard');
        } finally {
          setCheckingOnboarding(false);
        }
      } else {
        setSessionUser(null);
        setIsOnboarding(false);
        setCheckingOnboarding(false);
        setActivePage('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  // React Router integration for browser history, page redirection, and Back button support
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });
    }
  }, [navigate]);

  const activePage = pathToPageId(location.pathname);

  const setActivePage = (page: PageId) => {
    const targetPath = pageIdToPath(page);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Admin Route Protection Guard: Blocks unauthorized users from entering /admin/* pages
  useEffect(() => {
    if (sessionUser && activePage.startsWith('admin-') && userRole !== 'admin') {
      console.warn(`[Security] Unauthorized access attempt to ${activePage} by non-admin user (${userRole}). Redirecting...`);
      setActivePage(userRole === 'faculty' ? 'faculty-dashboard' : 'dashboard');
    }
  }, [activePage, userRole, sessionUser]);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Core records lists managed in React state (empty by default, loaded dynamically)
  const [sources, setSources] = useState<Source[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [competencyCatalog] = useState<CatalogCompetency[]>(INITIAL_COMPETENCY_CATALOG);
  const [activeAssessmentQuiz, setActiveAssessmentQuiz] = useState<Quiz | null>(null);

  const [processingLectureId, setProcessingLectureId] = useState<string | null>(null);
  const [processingAudioBlob, setProcessingAudioBlob] = useState<Blob | null>(null);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);


  // Callbacks: Sources
  const handleAddSource = (newSource: Source) => {
    setSources(prev => [newSource, ...prev]);
    // Send background notification automated
    const note: NotificationItem = {
      id: Math.random().toString(),
      title: `Source Synced: ${newSource.name}`,
      description: `Analyzing document headers, citation tags, and indexing semantic concepts...`,
      timeLabel: 'Today',
      category: 'system',
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [note, ...prev]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  // Callbacks: Lectures


  const handleCompleteAssessmentAttempt = (attemptRecord: QuizAttemptRecord) => {
    const existingComps = settings.profile.competencies || [];
    const targetCompId = attemptRecord.competencyId;
    const targetCompName = attemptRecord.competencyName || 'General Competency';

    const historyItem: CompetencyAttemptHistoryItem = {
      id: attemptRecord.id,
      quizId: attemptRecord.quizId,
      quizTitle: attemptRecord.quizTitle || 'Assessment',
      subject: attemptRecord.subject,
      scorePercentage: attemptRecord.scorePercentage || attemptRecord.accuracy,
      score: attemptRecord.score,
      totalQuestions: attemptRecord.totalQuestions,
      assessedLevel: attemptRecord.assessedLevel || 'Intermediate',
      assessedNumericLevel: attemptRecord.assessedNumericLevel || 2,
      passed: attemptRecord.passed !== false,
      attemptDate: attemptRecord.completedAt
    };

    const existingIndex = existingComps.findIndex(
      c => (c.competencyId && c.competencyId === targetCompId) || c.name.toLowerCase() === targetCompName.toLowerCase()
    );

    let updatedComps: TraineeCompetency[] = [];

    if (existingIndex >= 0) {
      updatedComps = existingComps.map((c, idx) => {
        if (idx !== existingIndex) return c;
        const currentHistory = c.assessmentHistory || [];
        return {
          ...c,
          latestAssessedLevel: attemptRecord.assessedLevel,
          latestAssessedNumericLevel: attemptRecord.assessedNumericLevel,
          latestScorePercentage: attemptRecord.scorePercentage,
          lastAssessedDate: attemptRecord.completedAt,
          assessmentHistory: [historyItem, ...currentHistory]
        };
      });
    } else {
      const catalogComp = competencyCatalog.find(c => c.id === targetCompId);
      const newCompItem: TraineeCompetency = {
        id: `comp-${Date.now()}`,
        competencyId: targetCompId,
        name: targetCompName,
        category: catalogComp?.category || 'Technical',
        level: attemptRecord.assessedLevel || 'Intermediate', // Initial declared level
        numericLevel: attemptRecord.assessedNumericLevel || 2,
        description: catalogComp?.description,
        latestAssessedLevel: attemptRecord.assessedLevel,
        latestAssessedNumericLevel: attemptRecord.assessedNumericLevel,
        latestScorePercentage: attemptRecord.scorePercentage,
        lastAssessedDate: attemptRecord.completedAt,
        assessmentHistory: [historyItem]
      };
      updatedComps = [...existingComps, newCompItem];
    }

    const updatedSettings: UserSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        competencies: updatedComps
      }
    };

    setSettings(updatedSettings);

    // Sync Course Enrollment & Issue Certificate when assessment is PASSED
    if (attemptRecord.passed !== false) {
      const targetCourse = COURSES.find(c => 
        (c.courseCode && c.courseCode === attemptRecord.subject) ||
        (c.competencyIds && c.competencyIds.includes(targetCompId)) ||
        (c.competencyNames && c.competencyNames.some(cn => cn.toLowerCase() === targetCompName.toLowerCase()))
      );

      if (targetCourse) {
        updateEnrollmentProgress(
          sessionUser?.uid || 'user-demo-1',
          settings.profile,
          targetCourse,
          100,
          true
        );
      }
    }

    const note: NotificationItem = {
      id: Math.random().toString(),
      title: `Assessment Completed: ${attemptRecord.quizTitle}`,
      description: `Competency: ${targetCompName} | Score: ${attemptRecord.scorePercentage}% | Assessed Level: ${attemptRecord.assessedLevel}`,
      timeLabel: 'Today',
      category: 'system',
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [note, ...prev]);
  };

  // Callbacks: Notifications actions
  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };


  // Callbacks: Settings & Upgrading Tiers
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('kuma_user_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('[Settings] Failed to save settings to localStorage:', e);
    }

    if (newSettings.profile?.theme && newSettings.profile.theme !== theme) {
      setTheme(newSettings.profile.theme as 'light' | 'dark');
    }

    if (sessionUser) {
      const fullDisplayName = `${newSettings.profile.firstName || ''} ${newSettings.profile.lastName || ''}`.trim() || newSettings.profile.fullName;

      if (auth.currentUser) {
        updateFirebaseProfile(auth.currentUser, {
          displayName: fullDisplayName,
          photoURL: newSettings.profile.avatarUrl || undefined
        }).catch((err) => console.warn('[Settings] Firebase Auth profile sync warning:', err));
      }

      setSessionUser(prev => prev ? { ...prev, fullName: fullDisplayName } : null);

      const profileData = {
        first_name: newSettings.profile.firstName || '',
        last_name: newSettings.profile.lastName || '',
        school_or_university: newSettings.profile.institution || '',
        email: newSettings.profile.emailAddress || '',
        country_code: newSettings.profile.countryCode || '',
        phone_number: newSettings.profile.phoneNumber || '',
        profile_image_url: newSettings.profile.avatarUrl || '',
        student_uid: newSettings.profile.uid || '',
        theme: newSettings.profile.theme || theme,
        onboarding_completed: true,
        updated_at: serverTimestamp()
      };
      
      console.log("Save settings attempt:", {
        currentUserUID: sessionUser.uid,
        authenticatedState: !!sessionUser.uid,
        firestoreDocumentPath: `users/${sessionUser.uid}`,
        writeRequestPayload: profileData
      });

      try {
        const userDocRef = doc(db, 'users', sessionUser.uid);
        await setDoc(userDocRef, profileData, { merge: true });
        console.log("Updated root user settings successfully in users/" + sessionUser.uid);
      } catch (err: any) {
        console.error("Save settings failed:", {
          currentUserUID: sessionUser.uid,
          authenticatedState: !!sessionUser.uid,
          firestoreDocumentPath: `users/${sessionUser.uid}`,
          writeRequestPayload: profileData,
          exactFirestoreError: err
        });
      }
    }
  };

  const handleUpgradePlan = (planName: 'BYOK' | 'Premium' | 'Institution', price: string, billingCycle: 'monthly' | 'yearly') => {
    const upgradedFeatures = [
      'Direct API access (We provide keys)',
      'Unlimited managed AI runs',
      '100 GB High-Speed Storage',
      'Instant OCR & Math Formula Parsing',
      'Weak Topic Tracker Radar',
      'Priority Email & Chat Support'
    ];

    const updatedSubscription = {
      planName,
      price,
      billingCycle,
      nextBillDate: billingCycle === 'yearly' ? 'Dec 15, 2027' : 'Jan 15, 2027',
      features: planName === 'BYOK' 
        ? [
            'Bring Your Own Key (BYOK)',
            'Unlimited AI Synthesis & Chats',
            '100 GB High-Speed Storage',
            'Academic Library & Quiz Workspace'
          ] 
        : upgradedFeatures
    };

    setSettings(prev => ({
      ...prev,
      subscription: updatedSubscription
    }));

    if (sessionUser?.uid) {
      try {
        const userDocRef = doc(db, 'users', sessionUser.uid);
        setDoc(userDocRef, { subscription: updatedSubscription }, { merge: true }).catch(err => {
          console.warn("Failed to persist subscription upgrade to Firestore:", err);
        });
      } catch (err) {
        console.warn("Error initiating subscription upgrade Firestore save:", err);
      }
    }
  };

  // Sync click shortcut helper
  const handleNewAnalysisShortcut = () => {
    setActivePage('dashboard');
  };

  const handleLogOut = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await signOut(auth);
      setSessionUser(null);
      setLectures([]);
      setSources([]);
      setNotifications([]);
      setActivePage('landing');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLoginSuccess = async (user: { fullName: string; emailAddress: string; role?: string }) => {
    console.log("Login success callback triggered for:", user);
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.onboarding_completed) {
            setIsOnboarding(false);
            if (data.ai_provider) localStorage.setItem('kuma_active_ai_provider', data.ai_provider);
            if (data.selected_model) localStorage.setItem('kuma_active_ai_model', data.selected_model);
            if (data.api_key) {
              localStorage.setItem('kuma_user_api_key', data.api_key);
              if (data.ai_provider) localStorage.setItem(`kuma_user_api_key_${data.ai_provider}`, data.api_key);
            }
            const rawRole = (user.role || data.role || '').toLowerCase();
            const userEmail = (data.email || user.emailAddress || currentUser.email || '').toLowerCase();
            const detectedRole: 'student' | 'faculty' | 'admin' = (rawRole === 'admin' || userEmail === 'admin@acme.com' || userEmail.includes('admin'))
              ? 'admin'
              : (rawRole === 'faculty' || rawRole === 'teacher' || rawRole === 'trainer' || userEmail.includes('trainer'))
              ? 'faculty'
              : 'student';

            setUserRole(detectedRole);
            if (detectedRole === 'admin') {
              setActivePage('admin-dashboard');
            } else if (detectedRole === 'faculty') {
              setActivePage('faculty-dashboard');
            } else {
              setActivePage('dashboard');
            }
            setSessionUser({
              uid: currentUser.uid,
              fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.fullName || user.fullName || currentUser.displayName || 'Academic Scholar',
              emailAddress: data.email || user.emailAddress || currentUser.email || ''
            });
            return;
          }
        }
      } catch (err) {
        console.warn("Error loading user profile in handleLoginSuccess:", err);
      }
    }

    const fallbackEmail = (user.emailAddress || '').toLowerCase();
    const fallbackRole = (user.role || '').toLowerCase();
    const detectedRole: 'student' | 'faculty' | 'admin' = (fallbackRole === 'admin' || fallbackEmail === 'admin@acme.com' || fallbackEmail.includes('admin'))
      ? 'admin'
      : (fallbackRole === 'faculty' || fallbackRole === 'trainer' || fallbackEmail.includes('trainer'))
      ? 'faculty'
      : 'student';

    setUserRole(detectedRole);
    if (detectedRole === 'admin') {
      setActivePage('admin-dashboard');
    } else if (detectedRole === 'faculty') {
      setActivePage('faculty-dashboard');
    } else {
      setActivePage('dashboard');
    }
    if (user.fullName) {
      setSessionUser(prev => prev ? { ...prev, fullName: user.fullName } : { uid: auth.currentUser?.uid || '', fullName: user.fullName, emailAddress: user.emailAddress });
    }
  };

  // Layout router switch
  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView
            setActivePage={setActivePage}
            lectures={[]}
            sources={sources}
            onNewAnalysis={handleNewAnalysisShortcut}
            onOpenLecture={(id) => {
              setActivePage('skill-gap');
            }}
            theme={theme}
            notes={notes}
            quizzes={quizzes}
            onOpenAssessment={(quizToTake) => setActiveAssessmentQuiz(quizToTake)}
            settings={settings}
          />
        );
      case 'profile':
        return (
          <ProfileView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            setActivePage={setActivePage}
            theme={theme}
          />
        );
      case 'skill-gap':
        return (
          <SkillGapView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            setActivePage={setActivePage}
            theme={theme}
            onTakeAssessment={(quizToTake) => setActiveAssessmentQuiz(quizToTake)}
          />
        );
      case 'certificates':
        return (
          <CertificatesView
            settings={settings}
            setActivePage={setActivePage}
          />
        );
      case 'verify-certificate':
        return (
          <CertificateVerificationView
            setActivePage={setActivePage}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onClearNotifications={handleClearNotifications}
            setActivePage={setActivePage}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            setActivePage={setActivePage}
            theme={theme}
            setTheme={setTheme}
            onLogOut={handleLogOut}
          />
        );
      case 'landing':
        return (
          <LandingView
            onEnterApp={() => setActivePage('dashboard')}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToPricing={() => setActivePage('pricing')}
            onGetStarted={() => {
              if (sessionUser) {
                setActivePage('dashboard');
              } else {
                setAuthMode('signup');
                setActivePage('auth');
              }
            }}
            onSignIn={() => {
              if (sessionUser) {
                setActivePage('dashboard');
              } else {
                setAuthMode('login');
                setActivePage('auth');
              }
            }}
          />
        );
      case 'help-support':
        return <SupportView />;
      case 'pricing':
        return (
          <PricingView
            settings={settings}
            onUpgradePlan={handleUpgradePlan}
            setActivePage={setActivePage}
          />
        );
      default:
        return (
          <DashboardView
            setActivePage={setActivePage}
            lectures={[]}
            sources={sources}
            onNewAnalysis={handleNewAnalysisShortcut}
            onOpenLecture={(id) => {
              setActivePage('skill-gap');
            }}
            theme={theme}
            notes={notes}
            settings={settings}
          />
        );
    }
  };

  const isLanding = activePage === 'landing';

  if (checkingOnboarding) {
    return (
      <ErrorBoundary theme={theme}>
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[99999] bg-red-600 text-white text-center py-2 px-4 text-sm font-mono font-bold">
            ⚠️ No network connection. Some features may be unavailable.
          </div>
        )}
        <div className={`min-h-screen flex items-center justify-center ${
          theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-[#FAF9F5]'
        }`}>
          <BruteLoader size="lg" message="Loading Kuma Capacity Connect..." />
        </div>
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  if (activePage === 'landing') {
    return (
      <ErrorBoundary theme={theme}>
        <LandingView
          onEnterApp={() => { 
            if (sessionUser) {
              setActivePage(userRole === 'faculty' ? 'faculty-dashboard' : 'dashboard');
            } else {
              setAuthMode('login'); 
              setActivePage('auth'); 
            }
          }}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToPricing={() => setActivePage('pricing')}
          onGetStarted={() => { 
            if (sessionUser) {
              setActivePage(userRole === 'faculty' ? 'faculty-dashboard' : 'dashboard');
            } else {
              setAuthMode('signup'); 
              setActivePage('auth'); 
            }
          }}
          onSignIn={() => { 
            if (sessionUser) {
              setActivePage(userRole === 'faculty' ? 'faculty-dashboard' : 'dashboard');
            } else {
              setAuthMode('login'); 
              setActivePage('auth'); 
            }
          }}
        />
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  if (activePage === 'auth') {
    return (
      <ErrorBoundary theme={theme}>
        <AuthView 
          onLoginSuccess={handleLoginSuccess}
          initialMode={authMode}
          theme={theme}
          onNavigateToLanding={() => setActivePage('landing')}
        />
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  if (sessionUser === null) {
    if (activePage === 'pricing') {
      return (
        <ErrorBoundary theme={theme}>
          <div className="bg-[#FAF9F5] min-h-screen text-gray-900 overflow-x-hidden font-sans relative pb-12">
            <header className="sticky top-0 z-50 bg-[#FAF9F5]/80 backdrop-blur-md border-b border-[#EAE3D2] transition-colors">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('landing')}>
                  <AILogo size={38} showText={true} theme="light" />
                </div>
                <button 
                  onClick={() => setActivePage('landing')}
                  className="text-xs font-bold text-gray-600 hover:text-black cursor-pointer uppercase tracking-widest focus:outline-none"
                >
                  ← Back to Home
                </button>
              </div>
            </header>
            <main className="p-6">
              <PricingView
                settings={settings}
                onUpgradePlan={() => { setAuthMode('signup'); setActivePage('auth'); }}
                setActivePage={setActivePage}
              />
            </main>
          </div>
          <FeedbackWidget theme={theme} />
        </ErrorBoundary>
      );
    }
    return (
      <ErrorBoundary theme={theme}>
        <AuthView 
          onLoginSuccess={handleLoginSuccess}
          initialMode={authMode}
          theme={theme}
          onNavigateToLanding={() => setActivePage('landing')}
        />
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  if (isOnboarding) {
    setIsOnboarding(false);
  }

  if (notesLoading) {
    return <BruteLoader message="Initializing Kuma Capacity Connect Workspace..." />;
  }

  // ADMIN PORTAL WORKSPACE
  if (sessionUser && userRole === 'admin') {
    return (
      <ErrorBoundary theme={theme}>
        <AdminPortalApp
          user={{
            uid: sessionUser.uid,
            fullName: settings.profile.fullName || sessionUser.fullName,
            emailAddress: sessionUser.emailAddress,
            organization: settings.profile.organization || 'Acme Digital Services'
          }}
          activePage={activePage}
          setActivePage={setActivePage}
          onSignOut={handleLogOut}
          theme={theme}
        />
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  // TEACHER PORTAL WORKSPACE (Integrated from teachers-LMS-portal)
  if (sessionUser && userRole === 'faculty') {
    return (
      <ErrorBoundary theme={theme}>
        <TeacherPortalApp
          user={{
            uid: sessionUser.uid,
            fullName: settings.profile.fullName || sessionUser.fullName,
            emailAddress: sessionUser.emailAddress,
            teacherCode: settings.profile.teacherCode,
            institution: settings.profile.institution
          }}
          onSignOut={handleLogOut}
          theme={theme}
          setTheme={setTheme}
        />
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary theme={theme}>
      {!isLanding && sessionUser && <NotificationPermissionBanner />}
      <div className="flex h-screen w-screen overflow-hidden transition-all duration-300 bg-[var(--bg-paper)] text-[var(--text-primary)]">
        
        {/* Sidebar - hides completely on landing page layout */}
        {!isLanding && (
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            isOpenMobile={isOpenMobile}
            setIsOpenMobile={setIsOpenMobile}
            settings={settings}
            onNewAnalysis={handleNewAnalysisShortcut}
            theme={theme}
            onLogOut={handleLogOut}
          />
        )}

        {/* Main core layout frame container */}
        <div className="flex flex-1 flex-col overflow-hidden h-full bg-[var(--bg-paper)]">
          {/* Navbar - hides on landing page layout */}
          {!isLanding && (
            <Navbar
              activePage={activePage}
              setActivePage={setActivePage}
              setIsOpenMobile={setIsOpenMobile}
              settings={settings}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onNewAnalysis={handleNewAnalysisShortcut}
              theme={theme}
              setTheme={setTheme}
              onLogOut={handleLogOut}
              isOnline={isOnline}
            />
          )}

          {/* Dynamic page contents viewer */}
          <main className={`flex-1 overflow-y-auto bg-[var(--bg-paper)] text-[var(--text-primary)] ${
            isLanding ? 'p-0' : 'p-2 md:p-3'
          }`}>
            {renderActiveView()}
          </main>
        </div>

      </div>

      {/* Interactive Step-by-Step Guiding Tour Popup System */}
      <GuidedTour
        isOpen={isGuidedTourOpen}
        onClose={() => setIsGuidedTourOpen(false)}
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
      />

      <AssessmentTakingModal
        isOpen={!!activeAssessmentQuiz}
        onClose={() => setActiveAssessmentQuiz(null)}
        quiz={activeAssessmentQuiz}
        catalog={competencyCatalog}
        userId={sessionUser?.uid || 'trainee-1'}
        userName={settings.profile.fullName || 'Trainee Learner'}
        onCompleteAttempt={handleCompleteAssessmentAttempt}
      />

      <FeedbackWidget theme={theme} />

    </ErrorBoundary>
  );
}
