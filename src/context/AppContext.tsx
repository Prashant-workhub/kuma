/**
 * Project Kuma - Centralized Unified State Store Context
 * Provides global state management for User Session, Settings, Role, Active Page,
 * Trainer Assignment, Certificates, and Enrollments.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PageId, 
  UserSettings, 
  TrainerProfile, 
  TrainerAssignmentRecord, 
  NotificationItem,
  TrainingCertificate,
  TrainingEnrollment
} from '../types';
import { INITIAL_SETTINGS, INITIAL_NOTIFICATIONS } from '../data';
import { getTraineeSelectedTrainer } from '../services/trainerDiscoveryService';
import { getUserCertificates } from '../utils/certificateUtils';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { isNetworkAvailable } from '../config';

export interface AppUserSession {
  uid: string;
  fullName: string;
  emailAddress: string;
  role: 'trainee' | 'faculty' | 'admin';
}

export interface AppContextType {
  // Session & Auth
  sessionUser: AppUserSession | null;
  setSessionUser: React.Dispatch<React.SetStateAction<AppUserSession | null>>;
  userRole: 'trainee' | 'faculty' | 'admin';
  setUserRole: (role: 'trainee' | 'faculty' | 'admin') => void;
  
  // Navigation
  activePage: PageId;
  setActivePage: (page: PageId) => void;

  // Settings & Profile
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Trainer Assignment
  selectedTrainerData: {
    assignment: TrainerAssignmentRecord;
    trainer: TrainerProfile;
  } | null;
  refreshTrainerAssignment: () => Promise<void>;

  // User Records
  userCertificates: TrainingCertificate[];
  userEnrollments: TrainingEnrollment[];
  notifications: NotificationItem[];
  
  // System State
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface AppProviderProps {
  children: React.ReactNode;
  initialPage?: PageId;
  initialSettings?: UserSettings;
}

export function AppProvider({ children, initialPage = 'landing', initialSettings = INITIAL_SETTINGS }: AppProviderProps) {
  const [sessionUser, setSessionUser] = useState<AppUserSession | null>(null);
  const [userRole, setUserRole] = useState<'trainee' | 'faculty' | 'admin'>('trainee');
  const [activePage, setActivePage] = useState<PageId>(initialPage);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedTrainerData, setSelectedTrainerData] = useState<{
    assignment: TrainerAssignmentRecord;
    trainer: TrainerProfile;
  } | null>(null);

  // Connectivity
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

  const userId = sessionUser?.uid || settings.profile.uid || '';

  // Derived user data
  const userCertificates = useMemo(() => getUserCertificates(userId), [userId]);
  const userEnrollments = useMemo(() => getUserEnrollments(userId), [userId]);

  // Trainer assignment refresh logic
  const refreshTrainerAssignment = useCallback(async () => {
    if (!userId) {
      setSelectedTrainerData(null);
      return;
    }
    try {
      const data = await getTraineeSelectedTrainer(userId);
      setSelectedTrainerData(data);
    } catch (err) {
      console.warn('[AppContext] Trainer refresh notice:', err);
    }
  }, [userId]);

  useEffect(() => {
    refreshTrainerAssignment();
  }, [refreshTrainerAssignment]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      profile: {
        ...prev.profile,
        ...(newSettings.profile || {})
      }
    }));
  }, []);

  const contextValue = useMemo<AppContextType>(() => ({
    sessionUser,
    setSessionUser,
    userRole,
    setUserRole,
    activePage,
    setActivePage,
    settings,
    updateSettings,
    selectedTrainerData,
    refreshTrainerAssignment,
    userCertificates,
    userEnrollments,
    notifications,
    isOnline
  }), [
    sessionUser,
    userRole,
    activePage,
    settings,
    updateSettings,
    selectedTrainerData,
    refreshTrainerAssignment,
    userCertificates,
    userEnrollments,
    notifications,
    isOnline
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom Hook to consume global AppContext
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
