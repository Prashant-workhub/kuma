/**
 * Project Kuma - Dedicated Trainer / Faculty Registration Flow (SIH26075 Capacity Connect)
 * Clean, 6-Step Trainer Registration with Organization Mapping, Competency Delivery Declaration & Training Preferences.
 */

import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  BookOpen,
  Target,
  Video,
  MapPin,
  Globe,
  Camera,
  Check
} from 'lucide-react';
import AILogo from './AILogo';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { SkillProficiencyLevel, CompetencyCategory } from '../types';

interface TrainerRegistrationViewProps {
  onLoginSuccess: (userData: { fullName: string; emailAddress: string; role: string }) => void;
  onNavigateToLogin: () => void;
  onNavigateToTraineeSignup: () => void;
  theme: 'light' | 'dark';
}

export interface SelectedTrainerCompetency {
  id: string;
  name: string;
  category: CompetencyCategory;
  description?: string;
  level: SkillProficiencyLevel;
  canTrain: boolean;
}

const SUGGESTED_SKILLS = [
  'Java', 'Python', 'React', 'Data Analysis', 'Cloud Computing', 'Machine Learning',
  'Cybersecurity', 'DevOps', 'System Design', 'Public Administration'
];

const DEFAULT_ORGANIZATIONS = [
  'National Skill Development Corporation (NSDC)',
  'Indian Institute of Technology (IIT)',
  'Indian Institute of Management (IIM)',
  'Ministry of Skill Development & Entrepreneurship',
  'Central Institute of Educational Technology',
  'National Institute of Technical Teachers Training'
];

const DEFAULT_DEPARTMENTS = [
  'Computer Science & Artificial Intelligence',
  'Information Technology & Cyber Infrastructure',
  'Executive Leadership & Governance',
  'Data Science & Advanced Analytics',
  'Electronics & Communication Engineering'
];

const DEFAULT_DESIGNATIONS = [
  'Senior Faculty / Professor',
  'Associate Professor',
  'Master Trainer',
  'Domain Subject Matter Expert',
  'Lead Instructional Designer',
  'Corporate Training Lead'
];

const SUGGESTED_TRAINING_PROGRAMS = [
  'Advanced Full-Stack Web Development',
  'Enterprise Cloud & DevOps Architecture',
  'Data Science & Applied Machine Learning',
  'Cybersecurity & Network Defense',
  'Public Governance & Digital Transformation'
];

export default function TrainerRegistrationView({
  onLoginSuccess,
  onNavigateToLogin,
  onNavigateToTraineeSignup,
  theme
}: TrainerRegistrationViewProps) {
  const [step, setStep] = useState<number>(1);

  // STEP 1 — Account Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // STEP 2 — Organization & Professional Details
  const [organization, setOrganization] = useState(DEFAULT_ORGANIZATIONS[0]);
  const [customOrg, setCustomOrg] = useState('');
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [designation, setDesignation] = useState(DEFAULT_DESIGNATIONS[0]);
  const [customDesig, setCustomDesig] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [qualification, setQualification] = useState("Doctorate / Ph.D.");

  // STEP 3 — Trainer Profile
  const [bio, setBio] = useState('');
  const [areaOfExpertise, setAreaOfExpertise] = useState('Computer Science & Artificial Intelligence');
  const [specialization, setSpecialization] = useState('Distributed Systems & Machine Learning');
  const [skills, setSkills] = useState<string[]>(['Java', 'Python', 'Cloud Computing', 'System Design']);
  const [skillInput, setSkillInput] = useState('');
  const [teachingExperience, setTeachingExperience] = useState('7+ Years in Academic & Corporate Technical Training');
  const [photoUrl, setPhotoUrl] = useState('');

  // STEP 4 — Competencies & Delivery Expertise
  const [selectedCompetencies, setSelectedCompetencies] = useState<Record<string, SelectedTrainerCompetency>>({
    'comp-java': {
      id: 'comp-java',
      name: 'Java Programming',
      category: 'Technical',
      description: 'Object-oriented programming, JVM architecture, concurrency, and enterprise frameworks.',
      level: 'Expert',
      canTrain: true
    },
    'comp-data-analysis': {
      id: 'comp-data-analysis',
      name: 'Data Analysis',
      category: 'Technical',
      description: 'Statistical reasoning, data visualization, exploratory analysis, and data-driven insights.',
      level: 'Advanced',
      canTrain: true
    },
    'comp-cloud': {
      id: 'comp-cloud',
      name: 'Cloud Computing',
      category: 'Technical',
      description: 'Cloud infrastructure deployment, virtualization, containerization, and serverless scaling.',
      level: 'Intermediate',
      canTrain: false
    }
  });
  const [competencySearch, setCompetencySearch] = useState('');
  const [customCompName, setCustomCompName] = useState('');
  const [customCompLevel, setCustomCompLevel] = useState<SkillProficiencyLevel>('Advanced');
  const [customCompCanTrain, setCustomCompCanTrain] = useState<boolean>(true);

  // STEP 5 — Training Information & Preferences
  const [trainingPrograms, setTrainingPrograms] = useState<string[]>([
    'Enterprise Cloud & DevOps Architecture',
    'Data Science & Applied Machine Learning'
  ]);
  const [programInput, setProgramInput] = useState('');
  const [trainingTopics, setTrainingTopics] = useState<string[]>([
    'Spring Boot Microservices',
    'Docker & Kubernetes Containerization',
    'Neural Networks & PyTorch'
  ]);
  const [topicInput, setTopicInput] = useState('');
  const [preferredTrainingMode, setPreferredTrainingMode] = useState<'Online' | 'Offline' | 'Hybrid'>('Hybrid');
  const [certifications, setCertifications] = useState<string[]>([
    'AWS Certified Solutions Architect',
    'Oracle Certified Master Java Developer'
  ]);
  const [certInput, setCertInput] = useState('');

  // Error & Status state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tag helper functions
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddProgram = (programToAdd: string) => {
    const trimmed = programToAdd.trim();
    if (trimmed && !trainingPrograms.includes(trimmed)) {
      setTrainingPrograms([...trainingPrograms, trimmed]);
      setProgramInput('');
    }
  };

  const handleRemoveProgram = (progToRemove: string) => {
    setTrainingPrograms(trainingPrograms.filter(p => p !== progToRemove));
  };

  const handleAddTopic = (topicToAdd: string) => {
    const trimmed = topicToAdd.trim();
    if (trimmed && !trainingTopics.includes(trimmed)) {
      setTrainingTopics([...trainingTopics, trimmed]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTrainingTopics(trainingTopics.filter(t => t !== topicToRemove));
  };

  const handleAddCertification = (certToAdd: string) => {
    const trimmed = certToAdd.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed]);
      setCertInput('');
    }
  };

  const handleRemoveCertification = (certToRemove: string) => {
    setCertifications(certifications.filter(c => c !== certToRemove));
  };

  // Competency selection handlers
  const handleToggleCompetency = (catComp: typeof INITIAL_COMPETENCY_CATALOG[0]) => {
    const exists = selectedCompetencies[catComp.id];
    if (exists) {
      const updated = { ...selectedCompetencies };
      delete updated[catComp.id];
      setSelectedCompetencies(updated);
    } else {
      setSelectedCompetencies({
        ...selectedCompetencies,
        [catComp.id]: {
          id: catComp.id,
          name: catComp.name,
          category: catComp.category as CompetencyCategory,
          description: catComp.description,
          level: 'Advanced',
          canTrain: true
        }
      });
    }
  };

  const handleCompetencyLevelChange = (compKey: string, newLevel: SkillProficiencyLevel) => {
    if (selectedCompetencies[compKey]) {
      setSelectedCompetencies({
        ...selectedCompetencies,
        [compKey]: {
          ...selectedCompetencies[compKey],
          level: newLevel
        }
      });
    }
  };

  const handleCompetencyCanTrainChange = (compKey: string, canTrain: boolean) => {
    if (selectedCompetencies[compKey]) {
      setSelectedCompetencies({
        ...selectedCompetencies,
        [compKey]: {
          ...selectedCompetencies[compKey],
          canTrain
        }
      });
    }
  };

  const handleAddCustomCompetency = () => {
    const trimmed = customCompName.trim();
    if (!trimmed) return;
    const customId = `custom-trainer-comp-${Date.now()}`;
    setSelectedCompetencies({
      ...selectedCompetencies,
      [customId]: {
        id: customId,
        name: trimmed,
        category: 'Domain Specific',
        description: 'Custom declared trainer competency',
        level: customCompLevel,
        canTrain: customCompCanTrain
      }
    });
    setCustomCompName('');
  };

  // Step validations
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phone.trim().replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const finalOrg = organization === 'Other' ? customOrg.trim() : organization;
    const finalDept = department === 'Other' ? customDept.trim() : department;
    const finalDesig = designation === 'Other' ? customDesig.trim() : designation;

    if (!finalOrg) newErrors.organization = 'Organization is required';
    if (!finalDept) newErrors.department = 'Department is required';
    if (!finalDesig) newErrors.designation = 'Designation is required';
    if (!qualification.trim()) newErrors.qualification = 'Highest Qualification is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!areaOfExpertise.trim()) newErrors.areaOfExpertise = 'Area of Expertise is required';
    if (!specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (skills.length === 0) newErrors.skills = 'Please add at least one skill tag';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (Object.keys(selectedCompetencies).length === 0) {
      newErrors.competencies = 'Please select at least one competency and specify delivery ability';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (trainingPrograms.length === 0 && trainingTopics.length === 0) {
      newErrors.trainingInfo = 'Please specify at least one training program or topic you can deliver';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    setFormError(null);
    let isValid = false;
    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();
    else if (step === 4) isValid = validateStep4();
    else if (step === 5) isValid = validateStep5();

    if (isValid && step < 6) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setFormError(null);
      setStep(step - 1);
    }
  };

  // Submit Trainer Registration
  const handleSubmitRegistration = async () => {
    setFormError(null);
    setIsSubmitting(true);

    const finalOrg = organization === 'Other' ? customOrg.trim() : organization;
    const finalDept = department === 'Other' ? customDept.trim() : department;
    const finalDesig = designation === 'Other' ? customDesig.trim() : designation;

    const formattedCompetencies = Object.values(selectedCompetencies).map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description || '',
      level: c.level,
      canTrain: c.canTrain
    }));

    try {
      // 1. Register with Firebase Auth
      let uid = `trainer_${Date.now()}`;
      let authEmail = email.trim().toLowerCase();

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
        uid = userCredential.user.uid;
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: fullName.trim() });
        }
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already registered. Please sign in or use a different email.');
        } else if (authErr.code === 'auth/invalid-email') {
          throw new Error('The email address format is invalid.');
        } else if (authErr.code === 'auth/weak-password') {
          throw new Error('Password is too weak. Please use at least 6 characters.');
        } else {
          console.warn('[Trainer Registration] Auth fallback to local session:', authErr);
        }
      }

      // 2. Build Trainer Profile Document
      const trainerProfile = {
        uid,
        role: 'faculty', // 'faculty' maps to Trainer role across Project Kuma portals
        trainerRole: 'trainer',
        fullName: fullName.trim(),
        email: authEmail,
        phone: phone.trim(),
        organization: finalOrg,
        department: finalDept,
        designation: finalDesig,
        yearsOfExperience: Number(experienceYears) || 0,
        qualification,
        bio: bio.trim(),
        areaOfExpertise: areaOfExpertise.trim(),
        specialization: specialization.trim(),
        skills,
        trainerExperience: teachingExperience.trim(),
        profilePhoto: photoUrl.trim() || undefined,
        competencies: formattedCompetencies,
        trainingPrograms,
        trainingTopics,
        preferredTrainingMode,
        certifications,
        onboarding_completed: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 3. Write profile to Firestore
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, trainerProfile, { merge: true });
      } catch (dbErr) {
        console.warn('[Trainer Registration] Firestore document write warning:', dbErr);
      }

      // 4. Save to local storage for immediate app session sync
      try {
        const localSettingsKey = 'kuma_user_settings';
        const existingSettingsRaw = localStorage.getItem(localSettingsKey);
        const existingSettings = existingSettingsRaw ? JSON.parse(existingSettingsRaw) : {};

        const mergedSettings = {
          ...existingSettings,
          profile: {
            ...existingSettings.profile,
            uid,
            fullName: fullName.trim(),
            emailAddress: authEmail,
            role: 'faculty',
            phoneNumber: phone.trim(),
            organization: finalOrg,
            department: finalDept,
            designation: finalDesig,
            qualification,
            bio: bio.trim(),
            areaOfExpertise: areaOfExpertise.trim(),
            specialization: specialization.trim(),
            skills: skills.map(s => ({ id: `sk-${s}`, name: s, level: 'Expert' as SkillProficiencyLevel })),
            competencies: formattedCompetencies,
            trainingPrograms,
            trainingTopics,
            preferredTrainingMode,
            certifications
          }
        };
        localStorage.setItem(localSettingsKey, JSON.stringify(mergedSettings));
      } catch (lsErr) {}

      // 5. Trigger Success Callback (Reroutes to Trainer/Faculty Portal)
      onLoginSuccess({
        fullName: fullName.trim(),
        emailAddress: authEmail,
        role: 'faculty'
      });

    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const catalogFiltered = INITIAL_COMPETENCY_CATALOG.filter(c =>
    c.name.toLowerCase().includes(competencySearch.toLowerCase()) ||
    c.category.toLowerCase().includes(competencySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#030610] text-slate-900 dark:text-slate-100 font-sans select-none flex flex-col justify-between p-4 md:p-8">

      {/* Top Header Navigation */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-purple-100 dark:border-slate-800">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateToLogin}>
          <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <AILogo size={24} theme="light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white leading-none">KUMA</span>
              <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">FACULTY & TRAINER PORTAL</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide">SIH26075 Capacity Connect</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={onNavigateToLogin}
            className="text-slate-600 dark:text-slate-300 hover:text-[#992e9d] dark:hover:text-purple-300 font-medium transition-colors"
          >
            Already have an account? <span className="underline font-semibold">Login</span>
          </button>
          <button
            onClick={onNavigateToTraineeSignup}
            className="px-3.5 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 font-medium text-xs transition-colors"
          >
            Register as Trainee
          </button>
        </div>
      </header>

      {/* Main Card Container */}
      <main className="max-w-3xl mx-auto w-full my-8 bg-white dark:bg-[#0C1220] rounded-[11px] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xl space-y-6">

        {/* Title & Role Indicator */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60">
            <GraduationCap className="w-3.5 h-3.5" /> Trainer & Faculty Onboarding
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Register as Trainer
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Establish your trainer profile, teaching competencies, delivery capacity, and training programs in Capacity Connect.
          </p>
        </div>

        {/* 6-Step Progress Indicator */}
        <div className="grid grid-cols-6 gap-1.5 py-2 border-y border-slate-100 dark:border-slate-800/80">
          {[
            { s: 1, label: 'Account' },
            { s: 2, label: 'Org & Details' },
            { s: 3, label: 'Profile' },
            { s: 4, label: 'Competencies' },
            { s: 5, label: 'Training Info' },
            { s: 6, label: 'Review' }
          ].map((item) => (
            <div
              key={item.s}
              onClick={() => {
                if (item.s < step) setStep(item.s);
              }}
              className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-full text-center transition-all ${
                item.s < step ? 'cursor-pointer' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === item.s
                    ? 'bg-[#992e9d] text-white shadow-sm'
                    : item.s < step
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {item.s < step ? '✓' : item.s}
              </div>
              <span className={`text-[10px] font-medium truncate ${
                step === item.s
                  ? 'text-[#992e9d] dark:text-purple-300 font-semibold'
                  : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="p-4 rounded-[11px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* STEP 1: Account Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-[#992e9d]" /> Step 1: Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                </div>
                {errors.fullName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.fullName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@institution.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500 mt-0.5">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 mt-0.5">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-rose-500 mt-0.5">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Organization & Professional Details */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-[#992e9d]" /> Step 2: Organization & Professional Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Organization *</label>
                <select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                >
                  {DEFAULT_ORGANIZATIONS.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                  <option value="Other">+ Enter Custom Organization</option>
                </select>
                {organization === 'Other' && (
                  <input
                    type="text"
                    value={customOrg}
                    onChange={(e) => setCustomOrg(e.target.value)}
                    placeholder="Type Organization Name..."
                    className="w-full mt-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] text-xs text-slate-900 dark:text-white outline-none"
                  />
                )}
                {errors.organization && <p className="text-[11px] text-rose-500 mt-0.5">{errors.organization}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                >
                  {DEFAULT_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="Other">+ Enter Custom Department</option>
                </select>
                {department === 'Other' && (
                  <input
                    type="text"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    placeholder="Type Department Name..."
                    className="w-full mt-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] text-xs text-slate-900 dark:text-white outline-none"
                  />
                )}
                {errors.department && <p className="text-[11px] text-rose-500 mt-0.5">{errors.department}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Designation / Job Title *</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                >
                  {DEFAULT_DESIGNATIONS.map(desig => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                  <option value="Other">+ Enter Custom Designation</option>
                </select>
                {designation === 'Other' && (
                  <input
                    type="text"
                    value={customDesig}
                    onChange={(e) => setCustomDesig(e.target.value)}
                    placeholder="Type Designation Title..."
                    className="w-full mt-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] text-xs text-slate-900 dark:text-white outline-none"
                  />
                )}
                {errors.designation && <p className="text-[11px] text-rose-500 mt-0.5">{errors.designation}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Highest Qualification *</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                >
                  <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                  <option value="Master's Degree">Master's Degree (M.Tech / M.Sc / M.E / MBA)</option>
                  <option value="Bachelor's Degree">Bachelor's Degree (B.Tech / B.Sc / B.E)</option>
                  <option value="Professional Certification Master">Professional Master Certification</option>
                </select>
                {errors.qualification && <p className="text-[11px] text-rose-500 mt-0.5">{errors.qualification}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Trainer Profile */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Briefcase className="w-4 h-4 text-[#992e9d]" /> Step 3: Trainer Profile & Specialization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Area of Expertise *</label>
                <input
                  type="text"
                  value={areaOfExpertise}
                  onChange={(e) => setAreaOfExpertise(e.target.value)}
                  placeholder="e.g. Computer Science, Cloud Architecture"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
                {errors.areaOfExpertise && <p className="text-[11px] text-rose-500 mt-0.5">{errors.areaOfExpertise}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Specialization *</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Artificial Intelligence, Distributed Systems"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
                {errors.specialization && <p className="text-[11px] text-rose-500 mt-0.5">{errors.specialization}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Professional Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summary of academic background, research work, and teaching philosophy..."
                  className="w-full px-4 py-2.5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Trainer / Teaching Experience Summary</label>
                <input
                  type="text"
                  value={teachingExperience}
                  onChange={(e) => setTeachingExperience(e.target.value)}
                  placeholder="e.g. 8+ Years Senior Faculty & Corporate Technical Specialist"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
              </div>

              {/* Multi-skill tag manager */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Trainer Skills & Competencies *</label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(skillInput);
                      }
                    }}
                    placeholder="Add technical or domain skill and press Enter..."
                    className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200 hover:bg-purple-100"
                  >
                    + Add Skill
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="pt-1 text-[11px] text-slate-400">
                  <span className="font-medium mr-2">Quick Add:</span>
                  {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 5).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="mr-1.5 underline hover:text-[#992e9d]"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
                {errors.skills && <p className="text-[11px] text-rose-500 mt-0.5">{errors.skills}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Profile Photo URL (Optional)</label>
                <div className="relative">
                  <Camera className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Competencies & Expertise */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#992e9d]" /> Step 4: Competency Catalog & Delivery Ability
              </h3>
              <input
                type="text"
                value={competencySearch}
                onChange={(e) => setCompetencySearch(e.target.value)}
                placeholder="Search catalog competencies..."
                className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none w-full sm:w-56"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select competencies from the catalog. For each competency, declare your proficiency level and specify whether you can <strong>TRAIN / DELIVER</strong> learning content.
            </p>

            {errors.competencies && <p className="text-xs text-rose-500 font-medium">{errors.competencies}</p>}

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-[11px]">
              {catalogFiltered.map((c) => {
                const isSelected = !!selectedCompetencies[c.id];
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleCompetency(c)}
                    className={`p-3 rounded-[9px] border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? 'border-[#992e9d] bg-purple-50/50 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">{c.name}</div>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{c.category}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected ? 'bg-[#992e9d] text-white' : 'border border-slate-300 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{c.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Custom Competency Adder */}
            <div className="p-3 rounded-[11px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-[#080D1A]/40 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Custom Competency</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={customCompName}
                  onChange={(e) => setCustomCompName(e.target.value)}
                  placeholder="Competency Title..."
                  className="sm:col-span-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] text-xs font-medium text-slate-900 dark:text-white outline-none"
                />
                <select
                  value={customCompLevel}
                  onChange={(e) => setCustomCompLevel(e.target.value as SkillProficiencyLevel)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] text-xs font-medium text-slate-900 dark:text-white outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddCustomCompetency}
                  className="px-3 py-1.5 rounded-full bg-[#992e9d] text-white text-xs font-medium hover:bg-purple-700"
                >
                  + Add Custom
                </button>
              </div>
            </div>

            {/* Selected Competencies Delivery Declaration Cards */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Declared Competencies ({Object.keys(selectedCompetencies).length})
              </h4>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.values(selectedCompetencies).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">{item.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 font-medium">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Proficiency Level Selector */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-medium block">Proficiency Level</span>
                        <select
                          value={item.level}
                          onChange={(e) => handleCompetencyLevelChange(item.id, e.target.value as SkillProficiencyLevel)}
                          className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0C1220] text-xs font-semibold text-slate-900 dark:text-white outline-none"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>

                      {/* Can Train Toggle */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-medium block">Can Train?</span>
                        <button
                          type="button"
                          onClick={() => handleCompetencyCanTrainChange(item.id, !item.canTrain)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                            item.canTrain
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {item.canTrain ? '✓ Yes (Train)' : '✕ No'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCompetency(item as any)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Training Information & Preferences */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-[#992e9d]" /> Step 5: Training Information & Preferences
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Specify the courses, training programs, and topics you can deliver, alongside your preferred training mode.
            </p>

            <div className="space-y-4">

              {/* Preferred Training Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Preferred Training Delivery Mode *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { mode: 'Online', icon: Video, desc: 'Remote webinars, live streams & virtual labs' },
                    { mode: 'Offline', icon: MapPin, desc: 'In-person physical classroom & workshops' },
                    { mode: 'Hybrid', icon: Globe, desc: 'Blended digital & live classroom sessions' }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = preferredTrainingMode === m.mode;
                    return (
                      <div
                        key={m.mode}
                        onClick={() => setPreferredTrainingMode(m.mode as any)}
                        className={`p-3 rounded-[11px] border cursor-pointer transition-all flex flex-col justify-between space-y-1 ${
                          isSelected
                            ? 'border-[#992e9d] bg-purple-50/60 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 text-slate-600 dark:text-slate-400 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="w-4 h-4" />
                          {isSelected && <Check className="w-4 h-4 text-[#992e9d]" />}
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{m.mode}</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Training Programs / Courses Can Teach */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Courses & Training Programs You Can Deliver</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={programInput}
                    onChange={(e) => setProgramInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProgram(programInput);
                      }
                    }}
                    placeholder="Add training program title and press Enter..."
                    className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddProgram(programInput)}
                    className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200 hover:bg-purple-100"
                  >
                    + Add Program
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {trainingPrograms.map((prog) => (
                    <span
                      key={prog}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200/60 dark:border-purple-800/60"
                    >
                      <span>{prog}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProgram(prog)}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="pt-1 text-[11px] text-slate-400">
                  <span className="font-medium mr-2">Quick Add Suggested Programs:</span>
                  {SUGGESTED_TRAINING_PROGRAMS.filter(p => !trainingPrograms.includes(p)).slice(0, 3).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleAddProgram(p)}
                      className="mr-1.5 underline hover:text-[#992e9d]"
                    >
                      +{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Topics Can Teach */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Specific Topics / Modules You Can Teach</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic(topicInput);
                      }
                    }}
                    placeholder="Add topic (e.g. Spring Boot, Docker, Microservices) and press Enter..."
                    className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTopic(topicInput)}
                    className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200 hover:bg-purple-100"
                  >
                    + Add Topic
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {trainingTopics.map((top) => (
                    <span
                      key={top}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/60"
                    >
                      <span>{top}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(top)}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Certifications & Honors (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCertification(certInput);
                      }
                    }}
                    placeholder="Add certification (e.g. AWS Solutions Architect) and press Enter..."
                    className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCertification(certInput)}
                    className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200 hover:bg-purple-100"
                  >
                    + Add Cert
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {certifications.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/60 dark:border-amber-800/60"
                    >
                      <Award className="w-3 h-3" />
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(c)}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 6: Review & Final Registration */}
        {step === 6 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-[#992e9d]" /> Step 6: Review & Confirm Registration
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please review all entered details before finalizing your Trainer Registration.
            </p>

            <div className="space-y-3">

              {/* Review Card 1: Account Information */}
              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider">Account Information</h4>
                  <button onClick={() => setStep(1)} className="text-[11px] text-slate-500 hover:text-[#992e9d] underline font-medium">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Full Name:</span> <strong className="text-slate-900 dark:text-white">{fullName}</strong></div>
                  <div><span className="text-slate-400">Email:</span> <strong className="text-slate-900 dark:text-white">{email}</strong></div>
                  <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-900 dark:text-white">{phone}</strong></div>
                </div>
              </div>

              {/* Review Card 2: Organization & Professional Information */}
              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider">Organization & Professional Details</h4>
                  <button onClick={() => setStep(2)} className="text-[11px] text-slate-500 hover:text-[#992e9d] underline font-medium">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Organization:</span> <strong className="text-slate-900 dark:text-white">{organization === 'Other' ? customOrg : organization}</strong></div>
                  <div><span className="text-slate-400">Department:</span> <strong className="text-slate-900 dark:text-white">{department === 'Other' ? customDept : department}</strong></div>
                  <div><span className="text-slate-400">Designation:</span> <strong className="text-slate-900 dark:text-white">{designation === 'Other' ? customDesig : designation}</strong></div>
                  <div><span className="text-slate-400">Experience:</span> <strong className="text-slate-900 dark:text-white">{experienceYears} Years</strong></div>
                  <div className="col-span-2"><span className="text-slate-400">Qualification:</span> <strong className="text-slate-900 dark:text-white">{qualification}</strong></div>
                </div>
              </div>

              {/* Review Card 3: Trainer Profile */}
              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider">Trainer Profile & Skills</h4>
                  <button onClick={() => setStep(3)} className="text-[11px] text-slate-500 hover:text-[#992e9d] underline font-medium">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Expertise Area:</span> <strong className="text-slate-900 dark:text-white">{areaOfExpertise}</strong></div>
                  <div><span className="text-slate-400">Specialization:</span> <strong className="text-slate-900 dark:text-white">{specialization}</strong></div>
                  <div className="col-span-2"><span className="text-slate-400">Teaching Experience:</span> <strong className="text-slate-900 dark:text-white">{teachingExperience}</strong></div>
                  {bio && <div className="col-span-2"><span className="text-slate-400">Bio:</span> <p className="italic text-slate-700 dark:text-slate-300">{bio}</p></div>}
                  <div className="col-span-2 space-y-1">
                    <span className="text-slate-400">Skill Tags:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {skills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Card 4: Declared Competencies & Delivery */}
              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider">Competencies & Delivery Capacity</h4>
                  <button onClick={() => setStep(4)} className="text-[11px] text-slate-500 hover:text-[#992e9d] underline font-medium">Edit</button>
                </div>
                <div className="space-y-1.5">
                  {Object.values(selectedCompetencies).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({c.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#992e9d] dark:text-purple-300 font-bold text-[10px]">
                          {c.level}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.canTrain
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {c.canTrain ? 'Can Train: Yes' : 'Can Train: No'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Card 5: Training Information & Preferences */}
              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider">Training Preferences & Offerings</h4>
                  <button onClick={() => setStep(5)} className="text-[11px] text-slate-500 hover:text-[#992e9d] underline font-medium">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-slate-400">Preferred Delivery Mode:</span> <strong className="text-slate-900 dark:text-white font-bold ml-1">{preferredTrainingMode}</strong>
                  </div>
                  {trainingPrograms.length > 0 && (
                    <div className="col-span-2 space-y-1">
                      <span className="text-slate-400">Training Programs:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {trainingPrograms.map(p => (
                          <span key={p} className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#992e9d] dark:text-purple-300 text-[10px] font-semibold">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {trainingTopics.length > 0 && (
                    <div className="col-span-2 space-y-1">
                      <span className="text-slate-400">Topics / Areas:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {trainingTopics.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {certifications.length > 0 && (
                    <div className="col-span-2 space-y-1">
                      <span className="text-slate-400">Certifications:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {certifications.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer Step Controls (Back / Next / Submit) */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium"
            >
              Cancel
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-full bg-[#992e9d] text-white text-xs font-bold hover:bg-purple-700 shadow-md transition-colors flex items-center gap-1.5"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitRegistration}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Registering Trainer...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Complete Registration
                </>
              )}
            </button>
          )}
        </div>

      </main>

      {/* Page Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
        © 2026 Project Kuma • Capacity Connect (SIH26075 Prototype). Secure Trainer Governance Infrastructure.
      </footer>

    </div>
  );
}
