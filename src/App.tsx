/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageIdToPath, pathToPageId } from './routes';
import { onAuthStateChanged, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { isNetworkAvailable } from './config';
import { useTheme } from './theme/theme';
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
import { getEnrollmentByCourse, updateEnrollmentProgress } from './utils/enrollmentUtils';
import { portalRoleFromProfile } from './utils/userRoles';
import { isDemoTraineeIdentity } from './utils/demoDataSeeder';
import { issuePersistentCertificate, persistAssessmentOutcome, subscribeTraineeAssignedAssessments } from './services/capacityConnectService';
import { saveAttempt, recordAssessedCompetency, recordDeclaredCompetency } from './services/learningDataService';
import { clearOfflineStores } from './offline/db';
import { COURSES } from './teacher-portal/lib/mockData';

// Core component imports
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
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
import { subscribeFacultyDoubts, generateTeacherCode } from './services/teacherDoubtService';
import FacultyOnboardingView from './components/faculty/FacultyOnboardingView';
import { startSyncManager } from './services/syncManager';
import { normalizeProfileFields } from './models/firestoreModels';
import { queueOperation } from './services/offlineOutbox';

import FindTrainerDiscoveryView from './components/FindTrainerDiscoveryView';
import SkillGapView from './components/SkillGapView';
import CertificatesView from './components/CertificatesView';
import CertificateVerificationView from './components/CertificateVerificationView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import SupportView from './components/SupportView';
import PricingView from './components/PricingView';

// Code Splitting for heavy portals
const TeacherPortalApp = lazy(() => import('./teacher-portal/TeacherPortalApp'));
const AdminPortalApp = lazy(() => import('./admin/AdminPortalApp'));

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

  // Theme is owned by the app-wide ThemeProvider (see `src/theme/theme.tsx`),
  // which is mounted once in `main.tsx`. This component only reads it.
  const { theme, setTheme } = useTheme()
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

  // Initialize offline sync manager whenever user session changes
  useEffect(() => {
    if (sessionUser?.uid) {
      const cleanup = startSyncManager(sessionUser.uid);
      return cleanup;
    }
  }, [sessionUser?.uid]);

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

            // A portal role comes from the UID-owned Firestore profile.
            const detectedRole = portalRoleFromProfile(rawRole) || 'student';
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

            const fullNameFromDb = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.fullName || loggedUser.fullName;

            // Parse user skills, competencies, and certifications strictly from Firestore document
            let parsedSkills = Array.isArray(data.skills)
              ? data.skills.map((s: any, idx: number) => typeof s === 'string' ? { id: `sk-${idx}`, name: s, level: 'Intermediate' as const } : s)
              : [];

            let parsedCompetencies = Array.isArray(data.competencies)
              ? data.competencies
              : [];

            let parsedCertifications = Array.isArray(data.certifications)
              ? data.certifications
              : [];

            setSettings({
              profile: {
                uid: user.uid,
                fullName: fullNameFromDb,
                firstName: data.first_name || fullNameFromDb.split(' ')[0] || '',
                lastName: data.last_name || fullNameFromDb.split(' ').slice(1).join(' ') || '',
                emailAddress: data.email || loggedUser.emailAddress,
                bio: data.bio !== undefined ? data.bio : '',
                avatarUrl: data.profile_image_url || data.avatarUrl || '',
                institution: data.organization || data.school_or_university || '',
                role: detectedRole,
                organization: data.organization !== undefined ? data.organization : '',
                department: data.department !== undefined ? data.department : '',
                designation: data.designation !== undefined ? data.designation : '',
                yearsOfExperience: data.experienceYears !== undefined ? data.experienceYears : (data.yearsOfExperience !== undefined ? data.yearsOfExperience : 0),
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
            setUserRole('student');
            setSettings(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                uid: user.uid,
                fullName: loggedUser.fullName,
                firstName: loggedUser.fullName.split(' ')[0] || '',
                lastName: loggedUser.fullName.split(' ').slice(1).join(' '),
                emailAddress: loggedUser.emailAddress,
                bio: '',
                avatarUrl: '',
                institution: '',
                role: 'student',
                organization: '',
                department: '',
                designation: '',
                yearsOfExperience: 0,
                qualification: '',
                degree: '',
                domain: '',
                skills: [],
                competencies: [],
                certifications: [],
                onboardingCompleted: false,
                teacherCode: undefined
              }
            }));
            setSessionUser(loggedUser);
            setIsOnboarding(false);
            setActivePage('dashboard');
          }
        } catch (err: any) {
          console.error("Error checking user status:", err);
          setUserRole('student');
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              uid: user.uid,
              fullName: loggedUser.fullName,
              firstName: loggedUser.fullName.split(' ')[0] || '',
              lastName: loggedUser.fullName.split(' ').slice(1).join(' '),
              emailAddress: loggedUser.emailAddress,
              bio: '',
              avatarUrl: '',
              institution: '',
              role: 'student',
              organization: '',
              department: '',
              designation: '',
              yearsOfExperience: 0,
              qualification: '',
              degree: '',
              domain: '',
              skills: [],
              competencies: [],
              certifications: [],
              onboardingCompleted: false,
              teacherCode: undefined
            }
          }));
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);
  const [competencyCatalog] = useState<CatalogCompetency[]>(INITIAL_COMPETENCY_CATALOG);
  const [activeAssessmentQuiz, setActiveAssessmentQuiz] = useState<Quiz | null>(null);

  const isDemoTrainee = isDemoTraineeIdentity(sessionUser?.uid, sessionUser?.emailAddress);

  useEffect(() => {
    if (!sessionUser?.uid) {
      setQuizzes([]);
      setAssessmentsLoading(false);
      setAssessmentsError(null);
      return;
    }
    if (isDemoTrainee) {
      setQuizzes(INITIAL_QUIZZES);
      setAssessmentsLoading(false);
      setAssessmentsError(null);
      return;
    }
    setAssessmentsLoading(true);
    setAssessmentsError(null);
    return subscribeTraineeAssignedAssessments(
      sessionUser.uid,
      (assignedQuizzes) => {
        setQuizzes(assignedQuizzes);
        setAssessmentsLoading(false);
      },
      (error) => {
        console.error('[Assessments] Assignment subscription failed:', error);
        setAssessmentsError('Unable to load assigned assessments. Check your connection and try again.');
        setAssessmentsLoading(false);
      }
    );
  }, [sessionUser?.uid, sessionUser?.emailAddress, isDemoTrainee]);

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


  const handleCompleteAssessmentAttempt = async (attemptRecord: QuizAttemptRecord) => {
    if (!sessionUser?.uid || attemptRecord.userId !== sessionUser.uid) {
      throw new Error('Assessment identity does not match the authenticated Firebase UID.');
    }
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

    if (!isDemoTrainee) {
      await saveAttempt({
        id: attemptRecord.id,
        uid: sessionUser.uid,
        assessmentId: attemptRecord.quizId,
        competencyId: targetCompId || 'general',
        courseId: attemptRecord.trainingProgramId,
        answers: {},
        score: attemptRecord.scorePercentage || attemptRecord.accuracy || 0,
        resultingLevel: attemptRecord.assessedNumericLevel || 2,
        createdAt: attemptRecord.completedAt || new Date().toISOString()
      });

      if (targetCompId) {
        await recordAssessedCompetency(
          sessionUser.uid,
          targetCompId,
          attemptRecord.assessedNumericLevel || 2,
          attemptRecord.id
        );
      }

      const outcome = await persistAssessmentOutcome(attemptRecord, updatedComps);
      if (outcome.trainingCompleted && attemptRecord.trainingProgramId) {
        await issuePersistentCertificate(
          sessionUser.uid,
          updatedSettings.profile,
          attemptRecord.trainingProgramId,
          attemptRecord.id
        );
      }
    }
    setSettings(updatedSettings);

    // Demo completion uses the existing local fixture flow, but never invents module progress.
    if (isDemoTrainee && attemptRecord.passed !== false) {
      const targetCourse = COURSES.find(c =>
        (c.courseCode && c.courseCode === attemptRecord.subject) ||
        (c.competencyIds && c.competencyIds.includes(targetCompId)) ||
        (c.competencyNames && c.competencyNames.some(cn => cn.toLowerCase() === targetCompName.toLowerCase()))
      );

      if (targetCourse) {
        const demoUserId = settings.profile.emailAddress || sessionUser.uid;
        const existingEnrollment = getEnrollmentByCourse(demoUserId, targetCourse.id);
        updateEnrollmentProgress(
          demoUserId,
          settings.profile,
          targetCourse,
          existingEnrollment?.completionRate || 0,
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
    if (sessionUser) {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== sessionUser.uid) {
        throw new Error('Your authenticated profile is no longer available. Sign in again to save changes.');
      }
      const fullDisplayName = `${newSettings.profile.firstName || ''} ${newSettings.profile.lastName || ''}`.trim() || newSettings.profile.fullName;

      const profileData = normalizeProfileFields({
        uid: currentUser.uid,
        fullName: fullDisplayName,
        first_name: newSettings.profile.firstName || '',
        last_name: newSettings.profile.lastName || '',
        email: newSettings.profile.emailAddress || '',
        phone: newSettings.profile.phoneNumber || '',
        phone_number: newSettings.profile.phoneNumber || '',
        organization: newSettings.profile.organization || newSettings.profile.institution || '',
        school_or_university: newSettings.profile.institution || newSettings.profile.organization || '',
        department: newSettings.profile.department || '',
        designation: newSettings.profile.designation || '',
        experienceYears: Math.max(0, Number(newSettings.profile.yearsOfExperience) || 0),
        yearsOfExperience: Math.max(0, Number(newSettings.profile.yearsOfExperience) || 0),
        qualification: newSettings.profile.qualification || newSettings.profile.degree || '',
        domain: newSettings.profile.domain || '',
        bio: newSettings.profile.bio || '',
        skills: newSettings.profile.skills || [],
        competencies: newSettings.profile.competencies || [],
        certifications: newSettings.profile.certifications || [],
        country_code: newSettings.profile.countryCode || '',
        profile_image_url: newSettings.profile.avatarUrl || '',
        theme: newSettings.profile.theme || theme,
        onboarding_completed: true,
        updated_at: serverTimestamp()
      });

      if (!isOnline) {
        // Queue to IndexedDB outbox when offline
        await queueOperation(currentUser.uid, 'profile_update', profileData);
      } else {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', currentUser.uid), profileData, { merge: true });
        if (userRole === 'student') {
          batch.set(doc(db, 'traineeProfiles', currentUser.uid), {
            uid: currentUser.uid,
            fullName: fullDisplayName,
            email: newSettings.profile.emailAddress || '',
            phone: newSettings.profile.phoneNumber || '',
            organization: newSettings.profile.organization || newSettings.profile.institution || '',
            department: newSettings.profile.department || '',
            designation: newSettings.profile.designation || '',
            yearsOfExperience: Math.max(0, Number(newSettings.profile.yearsOfExperience) || 0),
            qualification: newSettings.profile.qualification || newSettings.profile.degree || '',
            domain: newSettings.profile.domain || '',
            bio: newSettings.profile.bio || '',
            skills: newSettings.profile.skills || [],
            competencies: newSettings.profile.competencies || [],
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
        try {
          await batch.commit();

          // Sync competencies to competencyRecords/{uid}_{competencyId}
          if (newSettings.profile.competencies && newSettings.profile.competencies.length > 0) {
            for (const comp of newSettings.profile.competencies) {
              const compId = comp.competencyId || comp.id;
              const numericLvl = comp.numericLevel || (comp.level === 'Expert' ? 4 : comp.level === 'Advanced' ? 3 : comp.level === 'Intermediate' ? 2 : 1);
              if (compId) {
                await recordDeclaredCompetency(currentUser.uid, compId, numericLvl);
              }
            }
          }
        } catch (error) {
          console.warn('[Settings] Firestore online save failed; fallback queue to IndexedDB outbox:', error);
          await queueOperation(currentUser.uid, 'profile_update', profileData);
        }
      }

      updateFirebaseProfile(currentUser, {
        displayName: fullDisplayName,
        photoURL: newSettings.profile.avatarUrl || undefined
      }).catch((error) => console.warn('[Settings] Firebase Auth profile sync warning:', error));
      setSessionUser((previous) => previous ? { ...previous, fullName: fullDisplayName } : null);
    }

    setSettings(newSettings);
    try {
      localStorage.setItem('kuma_user_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('[Settings] Failed to save settings to localStorage:', error);
    }
    if (newSettings.profile?.theme && newSettings.profile.theme !== theme) {
      setTheme(newSettings.profile.theme as 'light' | 'dark');
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
      await clearOfflineStores();
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
            const rawRole = (data.role || user.role || '').toLowerCase();
            const detectedRole = portalRoleFromProfile(rawRole) || 'student';

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

    const fallbackRole = (user.role || '').toLowerCase();
    const detectedRole = portalRoleFromProfile(fallbackRole) || 'student';

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
          <>
            {assessmentsLoading && <div role="status" className="mx-auto mb-4 max-w-6xl rounded-md border border-line bg-panel px-4 py-3 text-sm text-muted">Loading your assigned assessments…</div>}
            {assessmentsError && <div role="alert" className="mx-auto mb-4 max-w-6xl rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{assessmentsError}</div>}
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
          </>
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
      case 'find-trainer':
        return (
          <FindTrainerDiscoveryView
            settings={settings}
            setActivePage={setActivePage}
            theme={theme}
          />
        );
      case 'my-learning':
        return (
          <FindTrainerDiscoveryView
            settings={settings}
            setActivePage={setActivePage}
            theme={theme}
          />
        );
      case 'assessments':
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
        <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-[#FAF9F5]'
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
        <Suspense fallback={<BruteLoader size="lg" message="Loading Admin Workspace..." />}>
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
        </Suspense>
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  // TEACHER PORTAL WORKSPACE (Integrated from teachers-LMS-portal)
  if (sessionUser && userRole === 'faculty') {
    return (
      <ErrorBoundary theme={theme}>
        <Suspense fallback={<BruteLoader size="lg" message="Loading Trainer Portal..." />}>
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
        </Suspense>
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
          {/* Demo Mode Banner for Evaluators */}
          {sessionUser && ['admin@acme.com', 'trainer@acme.com', 'trainee@acme.com', 'admin@capacityconnect.in', 'alex.rivera@capacityconnect.in', 'aarav.sharma@capacityconnect.in', 'guest.student@kuma.ai'].includes((sessionUser.emailAddress || settings.profile.emailAddress || '').toLowerCase()) && (
            <div className="bg-[#FFC400]/20 border-b-2 border-[#FFC400] px-4 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-[var(--text-primary)] z-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#FFC400] text-[#111111] font-extrabold text-[10px] tracking-wider uppercase shadow-paper-sm">
                  🧪 DEMO MODE ACTIVE
                </span>
                <span>
                  Logged in as Seeded <strong className="uppercase">{userRole}</strong> ({sessionUser.emailAddress})
                </span>
                <span className="hidden md:inline-block text-[11px] text-[var(--text-secondary)] border-l-2 border-[var(--border-main)] pl-2">
                  Organization: Acme Digital Services
                </span>
              </div>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--border-main)] bg-[var(--card-bg)] hidden sm:inline-block">
                Seeded Firestore Data
              </span>
            </div>
          )}

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
          <main className={`flex-1 overflow-y-auto bg-[var(--bg-paper)] text-[var(--text-primary)] ${isLanding ? 'p-0' : 'p-2 md:p-3'
            }`}>
            <Suspense fallback={<BruteLoader size="lg" message="Loading..." />}>
              {renderActiveView()}
            </Suspense>
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
