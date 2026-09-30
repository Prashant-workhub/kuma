import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Plus, X } from 'lucide-react';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { SkillProficiencyLevel, TraineeCompetency, CompetencyCategory } from '../types';
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
  Badge
} from './ui';

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

const DEFAULT_ORGANIZATIONS = [
  'Ministry of Skill Development',
  'Indian Railways',
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

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Professional Details
  const [organization, setOrganization] = useState(DEFAULT_ORGANIZATIONS[0]);
  const [customOrg, setCustomOrg] = useState('');
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [designation, setDesignation] = useState(DEFAULT_DESIGNATIONS[0]);
  const [customDesig, setCustomDesig] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(2);
  const [qualification, setQualification] = useState("Bachelor's degree");
  const [domain, setDomain] = useState('Software Engineering');

  // Step 3: Skills & Competencies
  const [skills, setSkills] = useState<string[]>(['Java', 'React', 'Data Analysis']);
  const [skillInput, setSkillInput] = useState('');
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
      description: 'Component lifecycle and state management.',
      level: 'Intermediate'
    }
  });

  const [competencySearch, setCompetencySearch] = useState('');
  const [customCompName, setCustomCompName] = useState('');
  const [customCompLevel, setCustomCompLevel] = useState<SkillProficiencyLevel>('Intermediate');

  // Errors & Loading
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (phone.trim().replace(/\D/g, '').length < 10) {
      errs.phone = 'Phone number must be at least 10 digits.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    const finalOrg = organization === 'Other' ? customOrg.trim() : organization;
    const finalDept = department === 'Other' ? customDept.trim() : department;
    const finalDesig = designation === 'Other' ? customDesig.trim() : designation;

    if (!finalOrg) errs.organization = 'Organization is required.';
    if (!finalDept) errs.department = 'Department is required.';
    if (!finalDesig) errs.designation = 'Designation is required.';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (Object.keys(selectedCompetencies).length === 0) {
      errs.competencies = 'Please select at least one competency.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    setFormError(null);
    let isValid = false;
    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();

    if (isValid && step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setFormError(null);
      setStep(step - 1);
    }
  };

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
          throw new Error('This email address is already registered. Please sign in instead.');
        } else if (authErr.code === 'auth/invalid-email') {
          throw new Error('The email address format is invalid.');
        } else if (authErr.code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters long.');
        } else {
          throw new Error('Account creation failed. Please verify your details and try again.');
        }
      }

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
        skills,
        competencies: formattedCompetencies,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid), traineeProfile, { merge: true });
      batch.set(doc(db, 'traineeProfiles', uid), {
        uid,
        fullName: traineeProfile.fullName,
        email: traineeProfile.email,
        phone: traineeProfile.phone,
        organization: traineeProfile.organization,
        department: traineeProfile.department,
        designation: traineeProfile.designation,
        yearsOfExperience: traineeProfile.experienceYears,
        qualification: traineeProfile.qualification,
        domain: traineeProfile.domain,
        skills: traineeProfile.skills,
        competencies: traineeProfile.competencies,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await batch.commit();

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
            skills,
            competencies: formattedCompetencies
          }
        };
        localStorage.setItem(localSettingsKey, JSON.stringify(mergedSettings));
      } catch (lsErr) { }

      onLoginSuccess({
        fullName: fullName.trim(),
        emailAddress: authEmail,
        role: 'trainee'
      });

    } catch (err: any) {
      setFormError(err.message || 'Registration failed due to a network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const catalogFiltered = INITIAL_COMPETENCY_CATALOG.filter(c =>
    c.name.toLowerCase().includes(competencySearch.toLowerCase()) ||
    c.category.toLowerCase().includes(competencySearch.toLowerCase())
  );

  const stepsList = [
    { num: 1, title: 'Account' },
    { num: 2, title: 'Professional details' },
    { num: 3, title: 'Skills & competencies' },
    { num: 4, title: 'Review' }
  ];

  return (
    <div className="min-h-screen w-full bg-page flex flex-col items-center justify-center p-4 font-sans text-text-primary">
      <div className="w-full max-w-2xl space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <button
            onClick={onNavigateToLogin}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to sign in</span>
          </button>
          <button
            onClick={onNavigateToTrainerSignup}
            className="text-xs text-primary hover:underline font-medium"
          >
            Register as trainer instead
          </button>
        </div>

        {/* Main Card Container */}
        <Card className="w-full border border-border shadow-sm p-6 bg-surface">
          <CardHeader className="p-0 mb-6 space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-text-primary">
              Trainee registration
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Create your account and declare your professional competencies.
            </CardDescription>
          </CardHeader>

          {/* Stepper Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              {stepsList.map((item) => {
                const isActive = step === item.num;
                const isDone = item.num < step;
                return (
                  <button
                    key={item.num}
                    type="button"
                    onClick={() => { if (isDone) setStep(item.num); }}
                    disabled={!isDone}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-primary font-semibold'
                        : isDone
                        ? 'text-text-primary hover:underline cursor-pointer'
                        : 'text-text-tertiary cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                        isActive
                          ? 'bg-primary text-white'
                          : isDone
                          ? 'bg-success text-white'
                          : 'bg-surface-muted text-text-tertiary border border-border'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : item.num}
                    </span>
                    <span className="hidden sm:inline">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <CardContent className="p-0 space-y-4">
            {formError && (
              <InlineAlert variant="danger" title="Registration failed">
                <div className="space-y-2">
                  <p>{formError}</p>
                  <Button variant="secondary" size="sm" onClick={handleSubmitRegistration} isLoading={isSubmitting}>
                    Retry registration
                  </Button>
                </div>
              </InlineAlert>
            )}

            {/* STEP 1: Account */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Step 1: Account information</h3>

                <FormField label="Full name" required errorText={fieldErrors.fullName}>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => { if (!fullName.trim()) setFieldErrors(prev => ({ ...prev, fullName: 'Full name is required.' })); }}
                    placeholder="First and last name"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email address" required errorText={fieldErrors.email}>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => {
                        if (!email.trim()) setFieldErrors(prev => ({ ...prev, email: 'Email address is required.' }));
                        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
                      }}
                      placeholder="name@organization.com"
                    />
                  </FormField>

                  <FormField label="Phone number" required errorText={fieldErrors.phone}>
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => { if (!phone.trim()) setFieldErrors(prev => ({ ...prev, phone: 'Phone number is required.' })); }}
                      placeholder="10-digit mobile number"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Password" required errorText={fieldErrors.password}>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
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

                  <FormField label="Confirm password" required errorText={fieldErrors.confirmPassword}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => { if (confirmPassword !== password) setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' })); }}
                      placeholder="Re-enter password"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 2: Professional Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Step 2: Professional details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Organization" required errorText={fieldErrors.organization}>
                    <Select
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                    >
                      {DEFAULT_ORGANIZATIONS.map(org => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                      <option value="Other">Other (custom)</option>
                    </Select>
                    {organization === 'Other' && (
                      <Input
                        type="text"
                        value={customOrg}
                        onChange={(e) => setCustomOrg(e.target.value)}
                        placeholder="Enter organization name"
                        className="mt-2"
                      />
                    )}
                  </FormField>

                  <FormField label="Department" required errorText={fieldErrors.department}>
                    <Select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      {DEFAULT_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      <option value="Other">Other (custom)</option>
                    </Select>
                    {department === 'Other' && (
                      <Input
                        type="text"
                        value={customDept}
                        onChange={(e) => setCustomDept(e.target.value)}
                        placeholder="Enter department name"
                        className="mt-2"
                      />
                    )}
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Designation" required errorText={fieldErrors.designation}>
                    <Select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      {DEFAULT_DESIGNATIONS.map(desig => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                      <option value="Other">Other (custom)</option>
                    </Select>
                    {designation === 'Other' && (
                      <Input
                        type="text"
                        value={customDesig}
                        onChange={(e) => setCustomDesig(e.target.value)}
                        placeholder="Enter designation title"
                        className="mt-2"
                      />
                    )}
                  </FormField>

                  <FormField label="Years of experience">
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Highest qualification">
                    <Select value={qualification} onChange={(e) => setQualification(e.target.value)}>
                      <option value="Bachelor's degree">Bachelor's degree</option>
                      <option value="Master's degree">Master's degree</option>
                      <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                      <option value="Diploma / Certification">Diploma / Certification</option>
                    </Select>
                  </FormField>

                  <FormField label="Domain / Area of work">
                    <Input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="e.g. Software Engineering"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 3: Skills & Competencies */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Step 3: Skills and competencies</h3>

                {/* Skill tags */}
                <FormField label="Technical skills" helpText="Press Enter or click Add to append a skill tag.">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(skillInput);
                        }
                      }}
                      placeholder="e.g. Java, Python, SQL"
                    />
                    <Button type="button" variant="secondary" onClick={() => handleAddSkill(skillInput)}>
                      Add
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {skills.map((sk) => (
                        <Badge key={sk} variant="info" className="flex items-center gap-1">
                          <span>{sk}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(sk)}
                            aria-label={`Remove ${sk}`}
                            className="hover:text-text-primary p-0.5"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormField>

                {/* Competencies catalog */}
                <FormField label="Declared competencies" required errorText={fieldErrors.competencies}>
                  <Input
                    type="text"
                    value={competencySearch}
                    onChange={(e) => setCompetencySearch(e.target.value)}
                    placeholder="Search competencies catalog..."
                    className="mb-3"
                  />

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {catalogFiltered.map((catComp) => {
                      const isSelected = !!selectedCompetencies[catComp.id];
                      const selectedObj = selectedCompetencies[catComp.id];
                      return (
                        <div
                          key={catComp.id}
                          className={`p-3 rounded-container border transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary-subtle'
                              : 'border-border bg-surface'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-text-primary">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCompetency(catComp)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{catComp.name}</span>
                            </label>
                            <Badge variant="neutral" size="sm">{catComp.category}</Badge>
                          </div>

                          {isSelected && selectedObj && (
                            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs">
                              <span className="text-text-secondary">Proficiency level:</span>
                              <Select
                                value={selectedObj.level}
                                onChange={(e) => handleCompetencyLevelChange(catComp.id, e.target.value as SkillProficiencyLevel)}
                                className="w-auto py-1 px-2 text-xs"
                              >
                                <option value="Beginner">1 - Beginner</option>
                                <option value="Intermediate">2 - Intermediate</option>
                                <option value="Advanced">3 - Advanced</option>
                                <option value="Expert">4 - Expert</option>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </FormField>

                {/* Custom Competency */}
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={customCompName}
                    onChange={(e) => setCustomCompName(e.target.value)}
                    placeholder="Add custom competency name..."
                  />
                  <Select
                    value={customCompLevel}
                    onChange={(e) => setCustomCompLevel(e.target.value as SkillProficiencyLevel)}
                    className="w-36"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleAddCustomCompetency}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Step 4: Review details</h3>

                <div className="space-y-3 text-xs">
                  {/* Account Summary */}
                  <div className="p-3 rounded-container border border-border bg-surface-subtle space-y-1">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <span className="font-semibold text-text-primary">Account details</span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="pt-1 space-y-0.5 text-text-secondary">
                      <div>Name: <span className="text-text-primary font-medium">{fullName}</span></div>
                      <div>Email: <span className="text-text-primary font-medium">{email}</span></div>
                      <div>Phone: <span className="text-text-primary font-medium">{phone}</span></div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="p-3 rounded-container border border-border bg-surface-subtle space-y-1">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <span className="font-semibold text-text-primary">Professional details</span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="pt-1 space-y-0.5 text-text-secondary">
                      <div>Organization: <span className="text-text-primary font-medium">{organization === 'Other' ? customOrg : organization}</span></div>
                      <div>Department: <span className="text-text-primary font-medium">{department === 'Other' ? customDept : department}</span></div>
                      <div>Designation: <span className="text-text-primary font-medium">{designation === 'Other' ? customDesig : designation}</span></div>
                      <div>Experience: <span className="text-text-primary font-medium">{experienceYears} years</span></div>
                    </div>
                  </div>

                  {/* Competencies Summary */}
                  <div className="p-3 rounded-container border border-border bg-surface-subtle space-y-1">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <span className="font-semibold text-text-primary">Skills and competencies ({Object.keys(selectedCompetencies).length})</span>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {Object.values(selectedCompetencies).map(c => (
                        <Badge key={c.id} variant="neutral" size="sm">
                          {c.name} ({c.level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={handlePrevStep}>
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button type="button" variant="primary" onClick={handleNextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmitRegistration} isLoading={isSubmitting}>
                Complete registration
              </Button>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}

