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
import { useLectures } from './hooks/useLectures';
import { 
  INITIAL_SOURCES, 
  INITIAL_LECTURES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SETTINGS,
  INITIAL_QUIZZES,
  INITIAL_COMPETENCY_CATALOG
} from './data';

// Component imports
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import KnowledgeStudioView from './components/KnowledgeStudioView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import SupportView from './components/SupportView';
import PricingView from './components/PricingView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import SkillGapView from './components/SkillGapView';
import CertificatesView from './components/CertificatesView';
import CertificateVerificationView from './components/CertificateVerificationView';
import LectureCaptureView from './components/LectureCaptureView';
import LectureProcessingView from './components/LectureProcessingView';
import LandingView from './components/LandingView';
import OnboardingView from './components/OnboardingView';
import BruteLoader from './components/BruteLoader';
import ErrorBoundary from './components/ErrorBoundary';
import FeedbackWidget from './components/FeedbackWidget';
import AssessmentTakingModal from './components/AssessmentTakingModal';
import AILogo from './components/AILogo';
import FloatingRecordingWidget from './components/FloatingRecordingWidget';
import GuidedTour from './components/GuidedTour';
import NotificationPermissionBanner from './components/NotificationPermissionBanner';
import { setupForegroundMessageListener, requestNotificationPermission } from './services/notificationService';

// Faculty Portal Imports
import { subscribeFacultyDoubts, generateTeacherCode } from './services/teacherDoubtService';
import FacultyOnboardingView from './components/faculty/FacultyOnboardingView';
import TeacherPortalApp from './teacher-portal/TeacherPortalApp';


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
  const [userRole, setUserRole] = useState<'student' | 'faculty'>('student');
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
        if (r.includes('knowledge') || r.includes('studio')) setActivePage('knowledge-studio');
        else if (r.includes('setting')) setActivePage('settings');
        else if (r.includes('capture')) setActivePage('lecture-capture');
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

  // Hook up Firestore notes & lectures in real-time
  const { notes, isLoading: notesLoading, error: notesError, addNote, updateNote, deleteNote } = useNotes(sessionUser?.uid);
  const { 
    lectures: dbLectures, 
    isLoading: lecturesLoading, 
    addLecture, 
    updateLecture, 
    deleteLecture, 
    uploadLectureAudio,
    uploadLectureDocument
  } = useLectures(sessionUser?.uid);

  // Use only real Firestore lectures
  const combinedLectures = dbLectures;

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
            const detectedRole = data.role === 'faculty' ? 'faculty' : 'student';
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

            setSettings(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                fullName: fullNameFromDb,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                emailAddress: data.email || loggedUser.emailAddress,
                institution: data.school_or_university || '',
                uid: data.uid || data.student_uid || '',
                countryCode: data.country_code || '',
                phoneNumber: data.phone_number || '',
                avatarUrl: data.profile_image_url || '',
                onboardingCompleted: isCompleted,
                role: detectedRole,
                teacherCode: calculatedCode
              },
              subscription: data.subscription ? data.subscription : prev.subscription
            }));
            setSessionUser({
              ...loggedUser,
              fullName: fullNameFromDb
            });

            if (detectedRole === 'faculty') {
              if (!isCompleted || !data.teacherCode) {
                setIsOnboarding(true);
              } else {
                setIsOnboarding(false);
                setActivePage('faculty-dashboard');
              }
            } else if (!isCompleted) {
              console.log("User onboarding incomplete. Directing to OnboardingView.");
              setIsOnboarding(true);
            } else {
              // Existing completed user: bypass onboarding and direct straight to dashboard!
              setIsOnboarding(false);
              setActivePage('dashboard');
            }
          } else {
            console.log("User document missing in Firestore for UID:", user.uid, "- New registration detected!");
            setSessionUser(loggedUser);
            setIsOnboarding(true);
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
  const handleAddLecture = async (newLecture: Lecture) => {
    if (sessionUser) {
      try {
        await addLecture({
          title: newLecture.title,
          subject: newLecture.subject,
          duration: newLecture.duration,
          pages: newLecture.pages,
          status: newLecture.status,
          type: newLecture.type,
          addedAt: 'Just now'
        });
      } catch (err) {
        console.error('Failed to add lecture to Firestore:', err);
      }
    } else {
      setLectures(prev => [newLecture, ...prev]);
    }

    // Also add to sources list as a PDF/text simulation
    const simulatedSrc: Source = {
      id: newLecture.id,
      name: newLecture.title + (newLecture.type === 'recording' ? '.wav' : '.pdf'),
      type: newLecture.type === 'recording' ? 'recording' : 'pdf',
      size: newLecture.type === 'recording' ? '14.5 MB' : '3.8 MB',
      addedAt: 'Just now'
    };
    setSources(prev => [simulatedSrc, ...prev]);
    
    // Notification log
    const note: NotificationItem = {
      id: Math.random().toString(),
      title: `New processing: ${newLecture.title}`,
      description: `High-Intensity Synthesis Engine has started transcribing and generating standard markdown outlines.`,
      timeLabel: 'Today',
      category: 'system',
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [note, ...prev]);
  };

  const handleDeleteLecture = async (id: string) => {
    if (sessionUser && dbLectures.some(l => l.id === id)) {
      try {
        await deleteLecture(id);
      } catch (err) {
        console.error('Failed to delete lecture from Firestore:', err);
      }
    } else {
      setLectures(prev => prev.filter(l => l.id !== id));
    }
  };

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

  const handleStartCapture = async (title: string, subject: string) => {
    if (!sessionUser) throw new Error('User not authenticated');
    const finalTitle = title.trim() || 'Auto-Detecting Topic...';
    const lectureId = await addLecture({
      title: finalTitle,
      subject,
      type: 'recording',
      status: 'recording',
      duration: '00:00:00'
    });
    const userDocRef = doc(db, 'users', sessionUser.uid, 'lectures', lectureId);
    await setDoc(userDocRef, { recordingStartedAt: serverTimestamp() }, { merge: true });
    return lectureId;
  };

  const handleSaveCapture = async (
    title: string, 
    subject: string, 
    duration: string, 
    audioBlob: Blob, 
    existingLectureId?: string,
    transcriptionEngine?: 'gemini' | 'browser',
    browserLiveTranscript?: string
  ) => {
    if (!sessionUser) return;
    try {
      let lectureId = existingLectureId;
      const finalTitle = title.trim() || 'Auto-Detecting Topic...';
      if (!lectureId) {
        lectureId = await addLecture({
          title: finalTitle,
          subject,
          duration,
          type: 'recording',
          status: 'recording',
          transcriptionEngine: transcriptionEngine || 'gemini',
          browserLiveTranscript: browserLiveTranscript || ''
        });
      } else {
        await updateLecture(lectureId, {
          title: finalTitle,
          subject,
          duration,
          status: 'recording',
          transcriptionEngine: transcriptionEngine || 'gemini',
          browserLiveTranscript: browserLiveTranscript || ''
        });
      }
      
      setProcessingLectureId(lectureId);
      setProcessingAudioBlob(audioBlob);
      setActivePage('lecture-processing');
    } catch (err) {
      console.error('Failed to start saving lecture capture:', err);
    }
  };

  const handleSaveDocument = async (title: string, subject: string, file: File) => {
    if (!sessionUser) return;
    try {
      let type: 'pdf' | 'ppt' | 'text' = 'pdf';
      if (file.name.endsWith('.pptx')) type = 'ppt';
      else if (file.name.endsWith('.docx')) type = 'text';

      const lectureId = await addLecture({
        title,
        subject,
        type,
        status: 'uploading'
      });
      
      setProcessingLectureId(lectureId);
      setProcessingFile(file);
      setProcessingAudioBlob(null);
      setActivePage('lecture-processing');
    } catch (err) {
      console.error('Failed to start saving document:', err);
    }
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
    setActivePage('knowledge-studio');
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
            const detectedRole = data.role === 'faculty' || user.role === 'faculty' ? 'faculty' : 'student';
            setUserRole(detectedRole);
            setActivePage(detectedRole === 'faculty' ? 'faculty-dashboard' : 'dashboard');
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

    if (user.role === 'faculty') {
      setUserRole('faculty');
      setActivePage('faculty-dashboard');
    } else {
      setUserRole('student');
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
            lectures={combinedLectures}
            sources={sources}
            onNewAnalysis={handleNewAnalysisShortcut}
            onOpenLecture={(id) => {
              setActivePage('knowledge-studio');
            }}
            theme={theme}
            notes={notes}
            quizzes={quizzes}
            onOpenAssessment={(quizToTake) => setActiveAssessmentQuiz(quizToTake)}
          />
        );
      case 'lecture-capture':
        return null;
      case 'lecture-processing':
        return (
          <LectureProcessingView
            userId={sessionUser?.uid}
            lectureId={processingLectureId}
            audioBlob={processingAudioBlob}
            documentFile={processingFile}
            uploadLectureAudio={uploadLectureAudio}
            uploadLectureDocument={uploadLectureDocument}
            updateLecture={updateLecture}
            setActivePage={setActivePage}
            theme={theme}
            setActiveLectureId={setActiveLectureId}
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
      case 'knowledge-studio':
        return (
          <KnowledgeStudioView
            userId={sessionUser?.uid}
            theme={theme}
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
            lectures={combinedLectures}
            sources={sources}
            onNewAnalysis={handleNewAnalysisShortcut}
            onOpenLecture={(id) => {
              setActivePage('knowledge-studio');
            }}
            theme={theme}
            notes={notes}
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
          <BruteLoader size="lg" message="Loading Note-IT AI Interface..." />
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
    if (userRole === 'faculty') {
      return (
        <ErrorBoundary theme={theme}>
          <FacultyOnboardingView
            userId={sessionUser.uid}
            email={sessionUser.emailAddress}
            initialFullName={sessionUser.fullName}
            onComplete={(facultyData) => {
              setSettings(prev => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  fullName: facultyData.fullName,
                  emailAddress: sessionUser.emailAddress,
                  institution: facultyData.university,
                  phoneNumber: facultyData.phoneNumber,
                  role: 'faculty',
                  teacherCode: facultyData.teacherCode,
                  onboardingCompleted: true
                }
              }));
              setIsOnboarding(false);
              setActivePage('faculty-dashboard');
            }}
          />
          <FeedbackWidget theme={theme} />
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary theme={theme}>
        <OnboardingView
          userId={sessionUser.uid}
          email={sessionUser.emailAddress}
          fullName={sessionUser.fullName}
          theme={theme}
          initialStep={onboardingStep}
          onComplete={(userData) => {
            setSettings(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || sessionUser.fullName,
                firstName: userData.first_name || '',
                lastName: userData.last_name || '',
                emailAddress: userData.email || sessionUser.emailAddress,
                institution: userData.school_or_university || '',
                countryCode: userData.country_code || '',
                phoneNumber: userData.phone_number || '',
                avatarUrl: userData.profile_image_url || '',
                onboardingCompleted: true
              }
            }));
            setIsOnboarding(false);
            setActivePage('dashboard');
          }}
        />
        <FeedbackWidget theme={theme} />
      </ErrorBoundary>
    );
  }

  if (notesLoading && lecturesLoading) {
    return <BruteLoader message="Initializing Note-IT Cognitive Workspace..." />;
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
            <div style={{ display: activePage === 'lecture-capture' ? 'block' : 'none', height: '100%' }}>
              <LectureCaptureView
                onSaveCapture={handleSaveCapture}
                onStartCapture={handleStartCapture}
                setActivePage={setActivePage}
                theme={theme}
                lectures={combinedLectures}
                activeLectureId={activeLectureId}
                setActiveLectureId={setActiveLectureId}
                notes={notes}
                onRecordingStatusChange={setGlobalRecordingState}
              />
            </div>
            {activePage !== 'lecture-capture' && renderActiveView()}
          </main>
        </div>

      </div>

      {/* Floating Resizable PiP Recording Box when tab is changed during recording */}
      {activePage !== 'lecture-capture' && globalRecordingState?.isRecording && (
        <FloatingRecordingWidget
          isRecording={globalRecordingState.isRecording}
          isPaused={globalRecordingState.isPaused}
          seconds={globalRecordingState.seconds}
          onPauseToggle={globalRecordingState.pauseCapture}
          onStop={globalRecordingState.stopCapture}
          onOpenCapture={() => setActivePage('lecture-capture')}
        />
      )}

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
