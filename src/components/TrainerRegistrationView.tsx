import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { normalizeProfileFields } from '../models/firestoreModels';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { SkillProficiencyLevel, CompetencyCategory } from '../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Select,
  FormField,
  InlineAlert,
} from './ui';

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

  // STEP 1 â€” Account Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // STEP 2 â€” Organization & Professional Details
  const [organization, setOrganization] = useState(DEFAULT_ORGANIZATIONS[0]);
  const [customOrg, setCustomOrg] = useState('');
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [designation, setDesignation] = useState(DEFAULT_DESIGNATIONS[0]);
  const [customDesig, setCustomDesig] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [qualification, setQualification] = useState("Doctorate / Ph.D.");

  // STEP 3 â€” Trainer Profile
  const [bio, setBio] = useState('');
  const [areaOfExpertise, setAreaOfExpertise] = useState('Computer Science & Artificial Intelligence');
  const [specialization, setSpecialization] = useState('Distributed Systems & Machine Learning');
  const [skills, setSkills] = useState<string[]>(['Java', 'Python', 'Cloud Computing', 'System Design']);
  const [skillInput, setSkillInput] = useState('');
  const [teachingExperience, setTeachingExperience] = useState('7+ Years in Academic & Corporate Technical Training');
  const [photoUrl, setPhotoUrl] = useState('');

  // STEP 4 â€” Competencies & Delivery Expertise
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

  // STEP 5 â€” Training Information & Preferences
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
      let authEmail = email.trim().toLowerCase();
      let uid: string;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
        uid = userCredential.user.uid;
        authEmail = userCredential.user.email || authEmail;
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

      // 2. Build Trainer Profile Document
      const trainerProfile = normalizeProfileFields({
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
      });

      // 3. Write profile to Firestore
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid), trainerProfile, { merge: true });

      // Publish only discovery-safe fields. Email and phone remain private
      // in users/{uid}; this record powers authenticated trainer search.
      batch.set(doc(db, 'trainerProfiles', uid), {
        uid,
        fullName: trainerProfile.fullName,
        organization: trainerProfile.organization,
        department: trainerProfile.department,
        designation: trainerProfile.designation,
        yearsOfExperience: trainerProfile.yearsOfExperience,
        qualification: trainerProfile.qualification,
        bio: trainerProfile.bio,
        areaOfExpertise: trainerProfile.areaOfExpertise,
        specialization: trainerProfile.specialization,
        skills: trainerProfile.skills,
        trainerExperience: trainerProfile.trainerExperience,
        profilePhoto: trainerProfile.profilePhoto || '',
        competencies: trainerProfile.competencies,
        trainingPrograms: trainerProfile.trainingPrograms,
        trainingTopics: trainerProfile.trainingTopics,
        preferredTrainingMode: trainerProfile.preferredTrainingMode,
        certifications: trainerProfile.certifications,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await batch.commit();

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
      } catch (lsErr) { }

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

  const TOTAL_STEPS = 4;

  // Map old 6-step model into 4-step UX:
  // Step 1 = Account (same)
  // Step 2 = Professional details (same as old 2)
  // Step 3 = Expertise (merges old 3 trainer profile + 4 competencies + 5 training info)
  // Step 4 = Review (same as old 6)
  // We need to intercept handleNextStep for the condensed step flow.
  // NOTE: We reuse the existing step state and validation functions directly.

  const stepsMeta = [
    { num: 1, label: 'Account' },
    { num: 2, label: 'Professional details' },
    { num: 3, label: 'Expertise' },
    { num: 4, label: 'Review' },
  ];

  // Map UI step 3 to old steps 3+4+5 validation chain
  const handleNext = () => {
    setFormError(null);
    let valid = false;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else if (step === 3) {
      // Validate all expertise sub-sections
      valid = validateStep3() && validateStep4() && validateStep5();
    }
    if (valid && step < TOTAL_STEPS) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) { setFormError(null); setStep(step - 1); }
  };

  // Tag input helpers
  const TagInput = ({
    value, onChange, onAdd, placeholder, id
  }: { value: string; onChange: (v: string) => void; onAdd: (v: string) => void; placeholder: string; id: string }) => (
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(value); } }}
        placeholder={placeholder}
        sizeVariant="sm"
        className="flex-1"
      />
      <Button variant="secondary" size="sm" type="button" onClick={() => onAdd(value)}>Add</Button>
    </div>
  );

  const TagList = ({ items, onRemove }: { items: string[]; onRemove: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5 pt-1" role="list">
      {items.map(item => (
        <span
          key={item}
          role="listitem"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-primary-subtle text-primary text-xs font-medium border border-primary/20"
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-sm text-primary/60 hover:text-danger transition-colors"
            aria-label={`Remove ${item}`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-page flex flex-col items-center justify-center p-4 font-sans text-text-primary">
      <div className="w-full max-w-2xl space-y-6">

        {/* Top navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <button
            onClick={onNavigateToLogin}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to sign in</span>
          </button>
          <button
            onClick={onNavigateToTraineeSignup}
            className="text-xs text-primary hover:underline font-medium"
          >
            Register as trainee instead
          </button>
        </div>

        {/* Main card */}
        <Card className="w-full border border-border shadow-sm p-6 bg-surface">
          <CardHeader className="p-0 mb-6 space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-text-primary">
              Trainer registration
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Create your trainer profile and declare your area of expertise. Your account will be reviewed by an administrator before activation.
            </CardDescription>
          </CardHeader>

          {/* Stepper */}
          <div className="mb-6">
            <div className="flex items-center justify-between border-b border-border pb-3" role="list" aria-label="Registration steps">
              {stepsMeta.map(item => {
                const isActive = step === item.num;
                const isDone = item.num < step;
                return (
                  <button
                    key={item.num}
                    role="listitem"
                    type="button"
                    onClick={() => { if (isDone) setStep(item.num); }}
                    disabled={!isDone}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                      isActive ? 'text-primary font-semibold'
                      : isDone ? 'text-text-primary hover:underline cursor-pointer'
                      : 'text-text-tertiary cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                        isActive ? 'bg-primary text-white'
                        : isDone ? 'bg-success text-white'
                        : 'bg-surface-muted text-text-tertiary border border-border'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : item.num}
                    </span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <CardContent className="p-0 space-y-5">
            {formError && (
              <InlineAlert variant="danger" title="Registration failed">
                <div className="space-y-2">
                  <p>{formError}</p>
                  <Button variant="secondary" size="sm" onClick={handleSubmitRegistration} isLoading={isSubmitting}>
                    Retry
                  </Button>
                </div>
              </InlineAlert>
            )}

            {/* STEP 1: Account */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Account information</h3>

                <FormField label="Full name" required errorText={errors.fullName}>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onBlur={() => { if (!fullName.trim()) setErrors(p => ({ ...p, fullName: 'Full name is required.' })); }}
                    placeholder="First and last name"
                    autoComplete="name"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email address" required errorText={errors.email}>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => {
                        if (!email.trim()) setErrors(p => ({ ...p, email: 'Email address is required.' }));
                        else if (!/\S+@\S+\.\S+/.test(email.trim())) setErrors(p => ({ ...p, email: 'Please enter a valid email address.' }));
                      }}
                      placeholder="name@organization.com"
                      autoComplete="email"
                    />
                  </FormField>

                  <FormField label="Phone number" required errorText={errors.phone}>
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onBlur={() => { if (!phone.trim()) setErrors(p => ({ ...p, phone: 'Phone number is required.' })); }}
                      placeholder="10-digit mobile number"
                      autoComplete="tel"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Password" required errorText={errors.password}>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="pr-10"
                        autoComplete="new-password"
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

                  <FormField label="Confirm password" required errorText={errors.confirmPassword}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onBlur={() => { if (confirmPassword !== password) setErrors(p => ({ ...p, confirmPassword: 'Passwords do not match.' })); }}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 2: Professional details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Professional details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Organization" required errorText={errors.organization}>
                    <Select
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                    >
                      {DEFAULT_ORGANIZATIONS.map(org => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                      <option value="Other">Other (specify below)</option>
                    </Select>
                    {organization === 'Other' && (
                      <Input
                        type="text"
                        value={customOrg}
                        onChange={e => setCustomOrg(e.target.value)}
                        placeholder="Enter organization name"
                        className="mt-2"
                      />
                    )}
                  </FormField>

                  <FormField label="Department" required errorText={errors.department}>
                    <Select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                    >
                      {DEFAULT_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      <option value="Other">Other (specify below)</option>
                    </Select>
                    {department === 'Other' && (
                      <Input
                        type="text"
                        value={customDept}
                        onChange={e => setCustomDept(e.target.value)}
                        placeholder="Enter department name"
                        className="mt-2"
                      />
                    )}
                  </FormField>

                  <FormField label="Designation" required errorText={errors.designation}>
                    <Select
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                    >
                      {DEFAULT_DESIGNATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="Other">Other (specify below)</option>
                    </Select>
                    {designation === 'Other' && (
                      <Input
                        type="text"
                        value={customDesig}
                        onChange={e => setCustomDesig(e.target.value)}
                        placeholder="Enter designation"
                        className="mt-2"
                      />
                    )}
                  </FormField>

                  <FormField label="Years of experience">
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={experienceYears}
                      onChange={e => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </FormField>

                  <FormField label="Highest qualification" required errorText={errors.qualification} className="sm:col-span-2">
                    <Select
                      value={qualification}
                      onChange={e => setQualification(e.target.value)}
                    >
                      <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                      <option value="Master's Degree">Master's degree</option>
                      <option value="Bachelor's Degree">Bachelor's degree</option>
                      <option value="Professional Certification Master">Professional certification</option>
                    </Select>
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 3: Expertise (profile + competencies + training info) */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-text-primary">Expertise</h3>

                {/* Profile section */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Trainer profile</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Area of expertise" required errorText={errors.areaOfExpertise}>
                      <Input
                        type="text"
                        value={areaOfExpertise}
                        onChange={e => setAreaOfExpertise(e.target.value)}
                        placeholder="e.g. Computer science, cloud architecture"
                        onBlur={() => { if (!areaOfExpertise.trim()) setErrors(p => ({ ...p, areaOfExpertise: 'Area of expertise is required.' })); }}
                      />
                    </FormField>

                    <FormField label="Specialization" required errorText={errors.specialization}>
                      <Input
                        type="text"
                        value={specialization}
                        onChange={e => setSpecialization(e.target.value)}
                        placeholder="e.g. Distributed systems, machine learning"
                        onBlur={() => { if (!specialization.trim()) setErrors(p => ({ ...p, specialization: 'Specialization is required.' })); }}
                      />
                    </FormField>

                    <FormField label="Teaching experience" className="sm:col-span-2">
                      <Input
                        type="text"
                        value={teachingExperience}
                        onChange={e => setTeachingExperience(e.target.value)}
                        placeholder="e.g. 8 years senior faculty and corporate trainer"
                      />
                    </FormField>

                    <FormField label="Bio" className="sm:col-span-2">
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Brief summary of your background and teaching approach"
                        className="w-full min-h-[64px] p-3 text-sm rounded-control border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-y transition-colors"
                      />
                    </FormField>
                  </div>

                  {/* Skills tags */}
                  <FormField label="Skills" required errorText={errors.skills}>
                    <TagInput
                      id="trainer-skill-input"
                      value={skillInput}
                      onChange={setSkillInput}
                      onAdd={handleAddSkill}
                      placeholder="Type a skill and press Enter"
                    />
                    {skills.length > 0 && <TagList items={skills} onRemove={handleRemoveSkill} />}
                  </FormField>
                </div>

                {/* Competencies section */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide pt-2">Competencies you can deliver</p>
                  <p className="text-xs text-text-secondary">
                    Select competencies from the catalog and set your proficiency level and whether you can train others.
                  </p>
                  {errors.competencies && <p className="text-xs font-medium text-danger">{errors.competencies}</p>}

                  <Input
                    type="text"
                    value={competencySearch}
                    onChange={e => setCompetencySearch(e.target.value)}
                    placeholder="Search competencies..."
                    sizeVariant="sm"
                  />

                  {/* Catalog grid */}
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-border rounded-container p-2"
                    role="listbox"
                    aria-label="Competency catalog"
                    aria-multiselectable="true"
                  >
                    {catalogFiltered.map(c => {
                      const isSelected = !!selectedCompetencies[c.id];
                      return (
                        <div
                          key={c.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleToggleCompetency(c)}
                          className={`p-2.5 rounded-control border cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'border-primary bg-primary-subtle'
                              : 'border-border bg-surface hover:border-border-strong'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-text-primary">{c.name}</p>
                            <p className="text-[11px] text-text-tertiary">{c.category}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected competency controls */}
                  {Object.values(selectedCompetencies).length > 0 && (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {Object.values(selectedCompetencies).map(item => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-control border border-border bg-surface"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text-primary">{item.name}</p>
                            <p className="text-[11px] text-text-secondary">{item.category}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Select
                              sizeVariant="sm"
                              value={item.level}
                              onChange={e => handleCompetencyLevelChange(item.id, e.target.value as SkillProficiencyLevel)}
                              aria-label={`Proficiency for ${item.name}`}
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Expert">Expert</option>
                            </Select>
                            <Button
                              variant={item.canTrain ? 'primary' : 'secondary'}
                              size="sm"
                              type="button"
                              onClick={() => handleCompetencyCanTrainChange(item.id, !item.canTrain)}
                              aria-pressed={item.canTrain}
                            >
                              {item.canTrain ? 'Can train' : 'Cannot train'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              isIconOnly
                              type="button"
                              onClick={() => handleToggleCompetency(item as any)}
                              aria-label={`Remove ${item.name}`}
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Training info section */}
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide pt-2">Training programs and topics</p>
                  {errors.trainingInfo && <p className="text-xs font-medium text-danger">{errors.trainingInfo}</p>}

                  {/* Preferred mode */}
                  <FormField label="Preferred delivery mode">
                    <div className="flex gap-2">
                      {(['Online', 'Offline', 'Hybrid'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPreferredTrainingMode(mode)}
                          aria-pressed={preferredTrainingMode === mode}
                          className={`flex-1 py-2 rounded-control text-xs font-medium border transition-colors ${
                            preferredTrainingMode === mode
                              ? 'border-primary bg-primary-subtle text-primary'
                              : 'border-border bg-surface text-text-secondary hover:border-border-strong'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Programs you can deliver">
                    <TagInput id="program-input" value={programInput} onChange={setProgramInput} onAdd={handleAddProgram} placeholder="Add training program and press Enter" />
                    {trainingPrograms.length > 0 && <TagList items={trainingPrograms} onRemove={handleRemoveProgram} />}
                  </FormField>

                  <FormField label="Topics and modules">
                    <TagInput id="topic-input" value={topicInput} onChange={setTopicInput} onAdd={handleAddTopic} placeholder="Add topic and press Enter" />
                    {trainingTopics.length > 0 && <TagList items={trainingTopics} onRemove={handleRemoveTopic} />}
                  </FormField>

                  <FormField label="Certifications (optional)">
                    <TagInput id="cert-input" value={certInput} onChange={setCertInput} onAdd={handleAddCertification} placeholder="Add certification and press Enter" />
                    {certifications.length > 0 && <TagList items={certifications} onRemove={handleRemoveCertification} />}
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Review your details</h3>
                <p className="text-xs text-text-secondary">Check the information below before submitting. Use the Edit links to go back and make changes.</p>

                {[
                  {
                    title: 'Account',
                    stepNum: 1,
                    rows: [
                      { label: 'Full name', value: fullName },
                      { label: 'Email address', value: email },
                      { label: 'Phone', value: phone },
                    ],
                  },
                  {
                    title: 'Professional details',
                    stepNum: 2,
                    rows: [
                      { label: 'Organization', value: organization === 'Other' ? customOrg : organization },
                      { label: 'Department', value: department === 'Other' ? customDept : department },
                      { label: 'Designation', value: designation === 'Other' ? customDesig : designation },
                      { label: 'Experience', value: `${experienceYears} years` },
                      { label: 'Qualification', value: qualification },
                    ],
                  },
                  {
                    title: 'Expertise',
                    stepNum: 3,
                    rows: [
                      { label: 'Area of expertise', value: areaOfExpertise },
                      { label: 'Specialization', value: specialization },
                      { label: 'Delivery mode', value: preferredTrainingMode },
                      { label: 'Skills', value: skills.join(', ') || 'â€”' },
                      { label: 'Competencies', value: Object.values(selectedCompetencies).map(c => c.name).join(', ') || 'â€”' },
                    ],
                  },
                ].map(section => (
                  <div
                    key={section.title}
                    className="rounded-container border border-border bg-surface-muted/40 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-text-primary">{section.title}</h4>
                      <button
                        type="button"
                        onClick={() => setStep(section.stepNum)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {section.rows.map(row => (
                        <div key={row.label} className="col-span-1">
                          <dt className="text-[11px] text-text-tertiary">{row.label}</dt>
                          <dd className="text-xs font-medium text-text-primary truncate">{row.value || 'â€”'}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}

                <InlineAlert variant="info" title="What happens after you submit">
                  Your registration will be reviewed by an organization administrator. You will receive an email once your account is activated. Until then, you will see a pending status when you sign in.
                </InlineAlert>
              </div>
            )}

            {/* Footer navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {step > 1 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handlePrev}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-xs text-text-secondary hover:text-text-primary font-medium"
                >
                  Cancel
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <Button variant="primary" size="sm" type="button" onClick={handleNext}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleSubmitRegistration}
                  isLoading={isSubmitting}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  Submit registration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

