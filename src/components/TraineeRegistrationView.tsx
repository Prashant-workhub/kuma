/**
 * Project Kuma - Dedicated Trainee Registration Flow (SIH26075 Capacity Connect)
 * Clean, 5-Step Trainee Registration with Organization Mapping & Competency Baseline Declaration.
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
  Target
} from 'lucide-react';
import AILogo from './AILogo';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { SkillProficiencyLevel, TraineeCompetency, CompetencyCategory } from '../types';

interface TraineeRegistrationViewProps {
  onLoginSuccess: (userData: { fullName: string; emailAddress: string; role: string }) => void;
  onNavigateToLogin: () => void;
  onNavigateToTrainerSignup: () => void;
  theme: 'light' | 'dark';
}

const LEVEL_NUMERIC_MAP: Record<SkillProficiencyLevel, 1 | 2 | 3 | 4> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4
};

const SUGGESTED_SKILLS = [
  'Java', 'React', 'Python', 'Data Analysis', 'SQL', 'Public Policy',
  'Cloud Architecture', 'Cybersecurity', 'Project Management', 'Machine Learning'
];

const DEFAULT_ORGANIZATIONS = [
  'Ministry of Skill Development & Entrepreneurship',
  'Indian Railways & Transportation',
  'Civil Services Department',
  'Department of Information Technology',
  'National Health Mission',
  'State Governance & Policy Directorate'
];

const DEFAULT_DEPARTMENTS = [
  'Capacity Building & Training',
  'Digital Infrastructure & IT',
  'Operations & Governance',
  'Data Science & Analytics',
  'Human Resources & Development'
];

const DEFAULT_DESIGNATIONS = [
  'Senior Training Associate',
  'Trainee Specialist',
  'Deputy Director',
  'Software Engineer',
  'Policy Analyst',
  'Project Officer'
];

export default function TraineeRegistrationView({
  onLoginSuccess,
  onNavigateToLogin,
  onNavigateToTrainerSignup,
  theme
}: TraineeRegistrationViewProps) {
  const [step, setStep] = useState<number>(1);

  // Step 1: Basic Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Organization Info
  const [organization, setOrganization] = useState(DEFAULT_ORGANIZATIONS[0]);
  const [customOrg, setCustomOrg] = useState('');
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [designation, setDesignation] = useState(DEFAULT_DESIGNATIONS[0]);
  const [customDesig, setCustomDesig] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(2);

  // Step 3: Professional Profile
  const [qualification, setQualification] = useState("Bachelor's Degree");
  const [domain, setDomain] = useState("Software Engineering & AI");
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>(['Java', 'React', 'Data Analysis']);
  const [skillInput, setSkillInput] = useState('');

  // Step 4: Competencies & Declared Levels
  const [selectedCompetencies, setSelectedCompetencies] = useState<Record<string, {
    id: string;
    name: string;
    category: CompetencyCategory;
    description?: string;
    level: SkillProficiencyLevel;
  }>>({
    'comp-react': {
      id: 'comp-react',
      name: 'React',
      category: 'Technical',
      description: 'Component lifecycle, custom hooks, context state management, and virtual DOM performance.',
      level: 'Intermediate'
    },
    'comp-db': {
      id: 'comp-db',
      name: 'Database Management',
      category: 'Technical',
      description: 'Relational data modeling, SQL query formulation, indexing, and transaction properties.',
      level: 'Beginner'
    }
  });

  const [competencySearch, setCompetencySearch] = useState('');

  // Custom competency input
  const [customCompName, setCustomCompName] = useState('');
  const [customCompLevel, setCustomCompLevel] = useState<SkillProficiencyLevel>('Intermediate');

  // Error & Status handling
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Skill Tag
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

  // Toggle Competency Selection
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
          level: 'Intermediate'
        }
      });
    }
  };

  // Change Declared Level for selected competency
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

  // Add Custom Competency
  const handleAddCustomCompetency = () => {
    const trimmed = customCompName.trim();
    if (!trimmed) return;
    const customId = `custom-comp-${Date.now()}`;
    setSelectedCompetencies({
      ...selectedCompetencies,
      [customId]: {
        id: customId,
        name: trimmed,
        category: 'Domain Specific',
        description: 'Custom declared competency',
        level: customCompLevel
      }
    });
    setCustomCompName('');
  };

  // Validation per step
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phone.trim().replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (!domain.trim()) newErrors.domain = 'Area of Work / Domain is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (Object.keys(selectedCompetencies).length === 0) {
      newErrors.competencies = 'Please select at least one competency and declare your level';
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

    if (isValid && step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setFormError(null);
      setStep(step - 1);
    }
  };

  // Submit Final Registration
  const handleSubmitRegistration = async () => {
    setFormError(null);
    setIsSubmitting(true);

    const finalOrg = organization === 'Other' ? customOrg.trim() : organization;
    const finalDept = department === 'Other' ? customDept.trim() : department;
    const finalDesig = designation === 'Other' ? customDesig.trim() : designation;

    const formattedCompetencies: TraineeCompetency[] = Object.values(selectedCompetencies).map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      level: c.level,
      numericLevel: LEVEL_NUMERIC_MAP[c.level],
      targetLevel: 'Advanced',
      targetNumericLevel: 3
    }));

    try {
      // 1. Create user in Firebase Auth
      let uid = `trainee_${Date.now()}`;
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
          throw new Error('Account creation could not be completed securely. Please check your connection and try again.');
        }
      }

      // 2. Build complete Trainee profile object
      const traineeProfile = {
        uid,
        role: 'trainee',
        fullName: fullName.trim(),
        email: authEmail,
        phone: phone.trim(),
        organization: finalOrg,
        department: finalDept,
        designation: finalDesig,
        experienceYears: Number(experienceYears) || 0,
        qualification,
        domain,
        bio: bio.trim(),
        skills,
        competencies: formattedCompetencies,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 3. Store in Firestore
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, traineeProfile, { merge: true });
      } catch (dbErr) {
        console.warn('[Registration] Firestore document write warning:', dbErr);
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
            role: 'trainee',
            phone: phone.trim(),
            organization: finalOrg,
            department: finalDept,
            designation: finalDesig,
            qualification,
            domain,
            bio: bio.trim(),
            skills,
            competencies: formattedCompetencies
          }
        };
        localStorage.setItem(localSettingsKey, JSON.stringify(mergedSettings));
      } catch (lsErr) {}

      // 5. Trigger Success Callback
      onLoginSuccess({
        fullName: fullName.trim(),
        emailAddress: authEmail,
        role: 'trainee'
      });

    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please check your network and try again.');
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
              <span className="bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/50">CAPACITY CONNECT</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide">SIH26075 Prototype</span>
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
            onClick={onNavigateToTrainerSignup}
            className="px-3.5 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 font-medium text-xs transition-colors"
          >
            Register as Trainer
          </button>
        </div>
      </header>

      {/* Main Registration Card Container */}
      <main className="max-w-3xl mx-auto w-full my-8 bg-white dark:bg-[#0C1220] rounded-[11px] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
        
        {/* Title & Role Indicator */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200/60 dark:border-purple-800/60">
            <Target className="w-3.5 h-3.5" /> Trainee Profile Registration
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Register as Trainee
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Establish your organizational designation, declared competencies, and professional baseline for AI-driven skill gap analysis.
          </p>
        </div>

        {/* 5-Step Progress Bar Pill */}
        <div className="grid grid-cols-5 gap-2 py-2 border-y border-slate-100 dark:border-slate-800/80">
          {[
            { s: 1, label: 'Account' },
            { s: 2, label: 'Organization' },
            { s: 3, label: 'Profile' },
            { s: 4, label: 'Competencies' },
            { s: 5, label: 'Review' }
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

        {/* Error Notification Banner */}
        {formError && (
          <div className="p-4 rounded-[11px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* STEP 1: Basic Account */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-[#992e9d]" /> Step 1: Basic Account Information
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
                    placeholder="e.g. Dr. Rajesh Kumar"
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
                    placeholder="trainee@organization.gov.in"
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

        {/* STEP 2: Organization Information */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-[#992e9d]" /> Step 2: Organization & Designation Mapping
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
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Designation / Role *</label>
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
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Professional Profile & Skills */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Briefcase className="w-4 h-4 text-[#992e9d]" /> Step 3: Professional Profile & Skill Tags
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Highest Qualification *</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                >
                  <option value="Bachelor's Degree">Bachelor's Degree (B.Tech / B.Sc / B.A)</option>
                  <option value="Master's Degree">Master's Degree (M.Tech / M.Sc / MBA)</option>
                  <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                  <option value="Diploma / Certification">Diploma / Certification</option>
                  <option value="Higher Secondary">Higher Secondary / Other</option>
                </select>
                {errors.qualification && <p className="text-[11px] text-rose-500 mt-0.5">{errors.qualification}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Area of Work / Domain *</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                >
                  <option value="Software Engineering & AI">Software Engineering & AI</option>
                  <option value="Public Governance & Policy">Public Governance & Policy</option>
                  <option value="Data Analytics & Insights">Data Analytics & Insights</option>
                  <option value="Cybersecurity & Cloud">Cybersecurity & Cloud</option>
                  <option value="Healthcare & Operations">Healthcare & Operations</option>
                </select>
                {errors.domain && <p className="text-[11px] text-rose-500 mt-0.5">{errors.domain}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Short Professional Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your role, capacity goals, and key areas of expertise..."
                  className="w-full px-4 py-2.5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d]"
                />
              </div>

              {/* Skills Tags Input */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Technical & Operational Skills</label>
                
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
                    placeholder="Add skill (e.g. Java, React, Data Analysis) and press Enter..."
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

                {/* Selected Skill Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 text-xs font-semibold border border-purple-200/60 dark:border-purple-800/60"
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

                {/* Quick Suggested Skill Tags */}
                <div className="pt-2 text-[11px] text-slate-400">
                  <span className="font-medium mr-2">Quick Add:</span>
                  {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 5).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="mr-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 text-[10px]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Competencies & Declared Levels */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#992e9d]" /> Step 4: Declared Competency Levels
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300">
                {Object.keys(selectedCompetencies).length} Selected
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select competencies from the catalog and set your self-declared baseline level (Beginner, Intermediate, Advanced, Expert). This establishes your starting profile for Skill Gap Diagnosis.
            </p>

            {errors.competencies && (
              <p className="text-xs font-semibold text-rose-500">{errors.competencies}</p>
            )}

            {/* Catalog Search */}
            <input
              type="text"
              value={competencySearch}
              onChange={(e) => setCompetencySearch(e.target.value)}
              placeholder="Filter catalog competencies (e.g. React, Node.js, Database)..."
              className="w-full px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none"
            />

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {catalogFiltered.map((catComp) => {
                const isSelected = !!selectedCompetencies[catComp.id];
                const selectedObj = selectedCompetencies[catComp.id];
                return (
                  <div
                    key={catComp.id}
                    className={`p-3.5 rounded-[11px] border transition-all ${
                      isSelected
                        ? 'border-[#992e9d] bg-purple-50/40 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCompetency(catComp)}
                            className="rounded accent-[#992e9d]"
                          />
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">{catComp.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{catComp.description}</p>
                      </div>

                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {catComp.category}
                      </span>
                    </div>

                    {/* Level selector if selected */}
                    {isSelected && selectedObj && (
                      <div className="mt-3 pt-2 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-semibold text-[#992e9d] dark:text-purple-300 uppercase">Declared Level:</span>
                        <select
                          value={selectedObj.level}
                          onChange={(e) => handleCompetencyLevelChange(catComp.id, e.target.value as SkillProficiencyLevel)}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#0C1220] border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="Beginner">1 - Beginner</option>
                          <option value="Intermediate">2 - Intermediate</option>
                          <option value="Advanced">3 - Advanced</option>
                          <option value="Expert">4 - Expert</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Competency Adder */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customCompName}
                onChange={(e) => setCustomCompName(e.target.value)}
                placeholder="Add Custom Competency..."
                className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs text-slate-900 dark:text-white outline-none"
              />
              <select
                value={customCompLevel}
                onChange={(e) => setCustomCompLevel(e.target.value as SkillProficiencyLevel)}
                className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              <button
                type="button"
                onClick={handleAddCustomCompetency}
                className="px-4 py-2 rounded-full bg-[#992e9d] hover:bg-[#832687] text-white text-xs font-semibold"
              >
                + Add Custom
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Step 5: Review Summary & Confirm Account
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2">
                <div className="text-[10px] font-bold text-[#992e9d] dark:text-purple-300 uppercase">Basic Account</div>
                <div><span className="text-slate-400">Name:</span> <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span></div>
                <div><span className="text-slate-400">Email:</span> <span className="font-semibold text-slate-900 dark:text-white">{email}</span></div>
                <div><span className="text-slate-400">Phone:</span> <span className="font-semibold text-slate-900 dark:text-white">{phone}</span></div>
              </div>

              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2">
                <div className="text-[10px] font-bold text-[#992e9d] dark:text-purple-300 uppercase">Organization Mapping</div>
                <div><span className="text-slate-400">Organization:</span> <span className="font-semibold text-slate-900 dark:text-white">{organization === 'Other' ? customOrg : organization}</span></div>
                <div><span className="text-slate-400">Department:</span> <span className="font-semibold text-slate-900 dark:text-white">{department === 'Other' ? customDept : department}</span></div>
                <div><span className="text-slate-400">Designation:</span> <span className="font-semibold text-slate-900 dark:text-white">{designation === 'Other' ? customDesig : designation}</span></div>
                <div><span className="text-slate-400">Experience:</span> <span className="font-semibold text-slate-900 dark:text-white">{experienceYears} Years</span></div>
              </div>

              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2 md:col-span-2">
                <div className="text-[10px] font-bold text-[#992e9d] dark:text-purple-300 uppercase">Skills & Domain</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map(s => (
                    <span key={s} className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 text-[11px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2 md:col-span-2">
                <div className="text-[10px] font-bold text-[#992e9d] dark:text-purple-300 uppercase">Declared Competencies ({Object.keys(selectedCompetencies).length})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {Object.values(selectedCompetencies).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-full bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300">
                        {c.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-full bg-[#992e9d] hover:bg-[#832687] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
            >
              Continue to Step {step + 1} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitRegistration}
              className="px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Trainee Account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Create Trainee Account
                </>
              )}
            </button>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400 py-4 border-t border-slate-100 dark:border-slate-800">
        Kuma Capacity Connect — SIH26075 Digital Capacity Building Prototype
      </footer>
    </div>
  );
}
