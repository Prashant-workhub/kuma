/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Award, 
  CheckCircle, 
  Save, 
  ArrowLeft, 
  Phone, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  BadgeCheck,
  Settings,
  Layers,
  Edit3
} from 'lucide-react';
import { 
  UserSettings, 
  SkillProficiencyLevel, 
  CompetencyCategory,
  CatalogCompetency,
  TraineeSkill, 
  TraineeCompetency, 
  TraineeCertification 
} from '../types';
import { Button, Card, Input } from './bauhaus';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { UserProfileAvatarPicker } from './bauhaus/UserProfileAvatarPicker';
import AdminCompetencyCatalogModal from './AdminCompetencyCatalogModal';
import CompetencyHistoryModal from './CompetencyHistoryModal';

interface ProfileViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  setActivePage: (page: any) => void;
  theme: 'light' | 'dark';
}

const COUNTRY_CODES = [
  { code: '+1', name: 'United States / Canada (+1)' },
  { code: '+44', name: 'United Kingdom (+44)' },
  { code: '+91', name: 'India (+91)' },
  { code: '+61', name: 'Australia (+61)' },
  { code: '+49', name: 'Germany (+49)' },
  { code: '+33', name: 'France (+33)' },
  { code: '+81', name: 'Japan (+81)' },
  { code: '+86', name: 'China (+86)' },
  { code: '+55', name: 'Brazil (+55)' }
];

const PROFICIENCY_LEVELS: SkillProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const LEVEL_TO_NUM: Record<SkillProficiencyLevel, 1 | 2 | 3 | 4> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4
};

const NUM_TO_LEVEL: Record<number, SkillProficiencyLevel> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert'
};

const LEVEL_COLORS: Record<SkillProficiencyLevel, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
  Intermediate: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300' },
  Advanced: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300' },
  Expert: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300' }
};

export default function ProfileView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme
}: ProfileViewProps) {
  
  // Basic Info State
  const [firstName, setFirstName] = useState(settings.profile.firstName || (settings.profile.fullName ? settings.profile.fullName.split(' ')[0] : 'Trainee'));
  const [lastName, setLastName] = useState(settings.profile.lastName || (settings.profile.fullName ? settings.profile.fullName.split(' ').slice(1).join(' ') : 'Learner'));
  const [email, setEmail] = useState(settings.profile.emailAddress || 'trainee@organization.gov.in');
  const [countryCode, setCountryCode] = useState(settings.profile.countryCode || '+91');
  const [phoneNumber, setPhoneNumber] = useState(settings.profile.phoneNumber || '9876543210');
  const [avatarUrl, setAvatarUrl] = useState(settings.profile.avatarUrl || '');
  
  // Professional Information State
  const [organization, setOrganization] = useState(settings.profile.organization || settings.profile.institution || 'Ministry of Skill Development & Entrepreneurship');
  const [department, setDepartment] = useState(settings.profile.department || 'Capacity Building & Training');
  const [designation, setDesignation] = useState(settings.profile.designation || settings.profile.role || 'Senior Training Associate');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(settings.profile.yearsOfExperience !== undefined ? settings.profile.yearsOfExperience : 4);
  const [bio, setBio] = useState(settings.profile.bio || 'Dedicated professional focusing on capacity building, learning, and skill development.');

  // Skills State
  const [skills, setSkills] = useState<TraineeSkill[]>(
    settings.profile.skills || [
      { id: 'sk-1', name: 'Data Analysis', level: 'Intermediate' },
      { id: 'sk-2', name: 'Communication & Outreach', level: 'Advanced' },
      { id: 'sk-3', name: 'Project Management', level: 'Beginner' }
    ]
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillProficiencyLevel>('Intermediate');

  // Competencies State & Catalog State
  const [competencyCatalog, setCompetencyCatalog] = useState<CatalogCompetency[]>(INITIAL_COMPETENCY_CATALOG);
  const [competencies, setCompetencies] = useState<TraineeCompetency[]>(
    settings.profile.competencies || [
      { id: 'comp-1', competencyId: 'cat-comp-6', name: 'Organizational Leadership', category: 'Leadership', level: 'Intermediate', numericLevel: 2, description: 'Guiding teams, setting strategic goals, and driving organizational transformation.' },
      { id: 'comp-2', competencyId: 'cat-comp-8', name: 'Public Policy Implementation', category: 'Domain Specific', level: 'Advanced', numericLevel: 3, description: 'Designing and executing public sector policies and governance frameworks.' },
      { id: 'comp-3', competencyId: 'cat-comp-9', name: 'Digital Literacy & Tech Adoption', category: 'Digital', level: 'Expert', numericLevel: 4, description: 'Adopting digital platforms, cloud workflows, and AI toolchains across units.' }
    ]
  );

  const [selectedCatalogCompId, setSelectedCatalogCompId] = useState<string>('');
  const [newCompLevel, setNewCompLevel] = useState<SkillProficiencyLevel>('Intermediate');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [historyModalComp, setHistoryModalComp] = useState<TraineeCompetency | null>(null);

  // Certifications State
  const [certifications, setCertifications] = useState<TraineeCertification[]>(
    settings.profile.certifications || [
      { id: 'cert-1', name: 'Certified Professional in Learning & Performance', issuingOrganization: 'ATD', issueDate: '2024-03-15', credentialId: 'ATD-88492' }
    ]
  );
  const [showCertForm, setShowCertForm] = useState(false);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certCredentialId, setCertCredentialId] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active catalog options for selection (excluding deactivated items and already added competencies)
  const availableCatalogOptions = competencyCatalog.filter(
    cat => cat.isActive && !competencies.some(c => c.competencyId === cat.id || c.name.toLowerCase() === cat.name.toLowerCase())
  );

  // Skill handlers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const item: TraineeSkill = {
      id: `sk-${Date.now()}`,
      name: newSkillName.trim(),
      level: newSkillLevel
    };
    setSkills([...skills, item]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  // Competency handlers using Catalog
  const handleAddCompetency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogCompId) {
      setError('Please select a competency from the organization catalog.');
      return;
    }
    const catItem = competencyCatalog.find(c => c.id === selectedCatalogCompId);
    if (!catItem) return;

    // Duplicate check
    if (competencies.some(c => c.competencyId === catItem.id || c.name.toLowerCase() === catItem.name.toLowerCase())) {
      setError('You have already added this competency to your profile.');
      return;
    }

    const item: TraineeCompetency = {
      id: `comp-${Date.now()}`,
      competencyId: catItem.id,
      name: catItem.name,
      category: catItem.category,
      level: newCompLevel,
      numericLevel: LEVEL_TO_NUM[newCompLevel],
      description: catItem.description
    };

    setCompetencies([...competencies, item]);
    setSelectedCatalogCompId('');
    setError(null);
  };

  const handleUpdateCompetencyLevel = (id: string, newLevel: SkillProficiencyLevel) => {
    setCompetencies(competencies.map(c => 
      c.id === id ? { ...c, level: newLevel, numericLevel: LEVEL_TO_NUM[newLevel] } : c
    ));
  };

  const handleUpdateTargetCompetencyLevel = (id: string, newTargetLevel: SkillProficiencyLevel) => {
    setCompetencies(competencies.map(c => 
      c.id === id ? { ...c, targetLevel: newTargetLevel, targetNumericLevel: LEVEL_TO_NUM[newTargetLevel] } : c
    ));
  };

  const handleRemoveCompetency = (id: string) => {
    setCompetencies(competencies.filter(c => c.id !== id));
  };

  // Certification handlers
  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim() || !certOrg.trim() || !certIssueDate) {
      setError('Certification Name, Issuing Organization, and Issue Date are required.');
      return;
    }
    const item: TraineeCertification = {
      id: `cert-${Date.now()}`,
      name: certName.trim(),
      issuingOrganization: certOrg.trim(),
      issueDate: certIssueDate,
      expiryDate: certExpiryDate ? certExpiryDate : undefined,
      credentialId: certCredentialId.trim() ? certCredentialId.trim() : undefined
    };
    setCertifications([...certifications, item]);
    setCertName('');
    setCertOrg('');
    setCertIssueDate('');
    setCertExpiryDate('');
    setCertCredentialId('');
    setShowCertForm(false);
    setError(null);
  };

  const handleRemoveCertification = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
  };

  // Save profile changes
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First Name, Last Name, and Email are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (yearsOfExperience < 0) {
      setError('Years of experience cannot be negative.');
      return;
    }

    const updatedSettings: UserSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        avatarUrl,
        countryCode,
        phoneNumber: phoneNumber.trim(),
        organization: organization.trim(),
        institution: organization.trim(),
        department: department.trim(),
        designation: designation.trim(),
        role: designation.trim(),
        yearsOfExperience: Math.max(0, Number(yearsOfExperience) || 0),
        bio: bio.trim(),
        skills,
        competencies,
        certifications,
        onboardingCompleted: true
      }
    };

    onUpdateSettings(updatedSettings);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // Visual Step Progress Bar (1-4 blocks)
  const renderProgressBar = (numLevel: number = 2, activeColor: string = 'bg-[#992e9d]') => {
    const blocks = [1, 2, 3, 4];
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1">
          {blocks.map((b) => (
            <div
              key={b}
              className={`h-2.5 w-3.5 rounded-sm transition-all ${
                b <= numLevel ? activeColor : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {numLevel}/4
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* Save Success Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#19B56B] text-white rounded-[6px] p-4 border-2 border-[#111111] shadow-paper-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-white shrink-0" />
          <div>
            <h4 className="text-xs font-heading font-extrabold uppercase">PROFILE SAVED SUCCESSFULLY</h4>
            <p className="text-[10px] font-mono mt-0.5">Professional credentials & competency levels updated.</p>
          </div>
        </div>
      )}

      {/* Competency Assessment History Modal */}
      <CompetencyHistoryModal
        isOpen={!!historyModalComp}
        onClose={() => setHistoryModalComp(null)}
        competency={historyModalComp}
      />

      {/* Admin Competency Catalog Modal */}
      <AdminCompetencyCatalogModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        catalog={competencyCatalog}
        onUpdateCatalog={(newCat) => setCompetencyCatalog(newCat)}
      />

      {/* Header Banner */}
      <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>BACK TO DASHBOARD</span>
          </button>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
            <User className="h-7 w-7 text-[#FFC400]" />
            TRAINEE PROFESSIONAL PROFILE
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
            {firstName && lastName ? `${firstName} ${lastName}` : 'Trainee Learner'} • {designation || 'Professional'} @ {organization || 'Organization'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => setIsAdminModalOpen(true)}
            icon={<Settings className="h-4 w-4 text-[#9C27B0]" />}
          >
            Manage Catalog (Admin)
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleSaveChanges}
            icon={<Save className="h-4 w-4" />}
            className="bg-[#FFC400] font-bold"
          >
            Save Profile
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] bg-[#FF4D4D]/10 border-2 border-[#FF4D4D] p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#FF4D4D] shrink-0 mt-0.5" />
          <div className="text-xs text-[#FF4D4D] font-mono font-bold">{error}</div>
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Summary & Basic Info */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Avatar Card */}
          <Card shadow="md" className="p-5 bg-[var(--card-bg)] border-2 border-[var(--border-main)] flex flex-col items-center text-center space-y-4 w-full">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Trainee Avatar"
                  className="h-28 w-28 rounded-[6px] border-2 border-[var(--border-main)] object-cover shadow-paper-sm"
                />
              ) : (
                <div className="h-28 w-28 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] flex items-center justify-center text-[#111111] font-heading font-bold text-3xl shadow-paper-sm">
                  {firstName ? firstName.charAt(0) : 'T'}
                </div>
              )}
            </div>

            <div className="space-y-1 w-full overflow-hidden">
              <h3 className="font-heading font-extrabold text-lg text-[var(--text-primary)] uppercase truncate px-2">
                {firstName && lastName ? `${firstName} ${lastName}` : 'Trainee Learner'}
              </h3>
              <p className="text-xs font-mono font-bold text-[#FFC400] truncate">
                {designation || 'Trainee'}
              </p>
              <p className="text-xs font-mono text-[var(--text-secondary)] truncate">
                {organization || 'Capacity Building Program'}
              </p>
            </div>

            <div className="w-full pt-2">
              <UserProfileAvatarPicker
                currentAvatarUrl={avatarUrl}
                onSelectAvatar={(url) => setAvatarUrl(url)}
                userInitial={firstName ? firstName.charAt(0) : 'T'}
              />
            </div>
          </Card>

          {/* About / Summary Section */}
          <Card shadow="md" className="p-5 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-3">
            <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] border-b-2 border-[var(--border-main)] pb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#FFC400]" />
              PROFESSIONAL SUMMARY
            </h3>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief professional bio, area of expertise, and learning objectives..."
              className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-3 text-xs font-sans text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[#FFC400]"
            />
          </Card>

        </div>

        {/* Right Columns: Main Credentials, Skills, Competencies, Certifications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1 & 2: Basic & Professional Information */}
          <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-5">
            <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] border-b-2 border-[var(--border-main)] pb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#2F6BFF]" />
              PROFESSIONAL & PERSONAL INFORMATION
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="FIRST NAME"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />

              <Input
                label="LAST NAME"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="EMAIL ADDRESS"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainee@organization.gov.in"
              />

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <label className="section-label text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[1px]">
                    CODE
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Input
                    label="PHONE NUMBER"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ORGANIZATION"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Ministry of Skill Development"
              />

              <Input
                label="DEPARTMENT"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Capacity Building & Training"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="DESIGNATION / ROLE"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Training Associate"
              />

              <Input
                label="YEARS OF EXPERIENCE"
                type="number"
                min="0"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Years of professional experience"
              />
            </div>
          </Card>

          {/* SECTION 4: COMPETENCIES (Centralized Catalog Connected) */}
          <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[var(--border-main)] pb-3 gap-2">
              <div>
                <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#FF9800]" />
                  SKILLS & COMPETENCIES
                </h3>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                  Assigned from Centralized Competency Catalog
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="text-xs font-mono font-bold text-[#9C27B0] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Catalog Settings</span>
              </button>
            </div>

            {/* List of Trainee Competencies with Cards & Visual Progress Bars */}
            <div className="space-y-3">
              {competencies.length === 0 ? (
                <div className="text-xs font-mono text-[var(--text-secondary)] italic py-2">
                  No competencies added yet. Select a competency from the catalog below.
                </div>
              ) : (
                competencies.map((comp) => {
                  const style = LEVEL_COLORS[comp.level] || LEVEL_COLORS.Intermediate;
                  const numLvl = comp.numericLevel || LEVEL_TO_NUM[comp.level] || 2;
                  
                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-3 shadow-paper-xs"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-main)]/40 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase">
                              {comp.name}
                            </h4>
                            {comp.category && (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[var(--border-main)] bg-[var(--card-bg)]">
                                {comp.category}
                              </span>
                            )}
                          </div>
                          {comp.description && (
                            <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                              {comp.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {comp.assessmentHistory && comp.assessmentHistory.length > 0 && (
                            <Button
                              type="button"
                              variant="tertiary"
                              size="sm"
                              onClick={() => setHistoryModalComp(comp)}
                              className="text-[11px]"
                            >
                              Assessment History ({comp.assessmentHistory.length})
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCompetency(comp.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                            title="Remove competency"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* 3 Columns: DECLARED LEVEL | ASSESSED LEVEL | TARGET LEVEL */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        
                        {/* 1. DECLARED LEVEL (User Editable) */}
                        <div className="p-3.5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase text-slate-400">
                              DECLARED LEVEL
                            </span>
                            <span className="text-[9px] text-slate-400 italic">Self-Selected</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            {renderProgressBar(numLvl, 'bg-amber-500')}
                            <select
                              value={comp.level}
                              onChange={(e) => handleUpdateCompetencyLevel(comp.id, e.target.value as SkillProficiencyLevel)}
                              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0C1220] px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer outline-none max-w-full truncate"
                            >
                              {PROFICIENCY_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 2. LATEST ASSESSED LEVEL (From Competency Assessment) */}
                        <div className="p-3.5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase text-slate-400">
                              LATEST ASSESSED LEVEL
                            </span>
                            {comp.latestScorePercentage !== undefined && (
                              <span className="text-[10px] font-semibold text-[#992e9d] dark:text-purple-300">
                                Score: {comp.latestScorePercentage}%
                              </span>
                            )}
                          </div>

                          {comp.latestAssessedLevel ? (
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              {renderProgressBar(comp.latestAssessedNumericLevel || 2, 'bg-emerald-500')}
                              <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                                {comp.latestAssessedLevel}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic pt-1">
                              No assessment taken yet.
                            </div>
                          )}
                        </div>

                        {/* 3. TARGET LEVEL (User Configurable) */}
                        <div className="p-3.5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] space-y-2 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase text-slate-400">
                              TARGET LEVEL
                            </span>
                            <span className="text-[9px] text-[#992e9d] dark:text-purple-300 font-semibold">Configurable</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            {renderProgressBar(comp.targetNumericLevel || LEVEL_TO_NUM[comp.targetLevel || 'Advanced'] || 3, 'bg-[#992e9d]')}
                            <select
                              value={comp.targetLevel || 'Advanced'}
                              onChange={(e) => handleUpdateTargetCompetencyLevel(comp.id, e.target.value as SkillProficiencyLevel)}
                              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0C1220] px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer outline-none max-w-full truncate"
                            >
                              {PROFICIENCY_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Competency from Catalog Form */}
            <div className="pt-3 border-t border-[var(--border-main)]/60">
              <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)] mb-2">
                Add Competency from Catalog
              </h4>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={selectedCatalogCompId}
                  onChange={(e) => setSelectedCatalogCompId(e.target.value)}
                  className="flex-1 w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                >
                  <option value="">-- Select Competency from Organization Catalog --</option>
                  {availableCatalogOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.category})
                    </option>
                  ))}
                </select>

                <select
                  value={newCompLevel}
                  onChange={(e) => setNewCompLevel(e.target.value as SkillProficiencyLevel)}
                  className="w-full sm:w-auto rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                >
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCompetency}
                  disabled={!selectedCatalogCompId}
                  icon={<Plus className="h-3.5 w-3.5" />}
                  className="w-full sm:w-auto shrink-0 bg-[#FFC400] disabled:opacity-50"
                >
                  Add Competency
                </Button>
              </div>
            </div>
          </Card>

          {/* SECTION 3: Additional Professional Skills */}
          <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
            <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] border-b-2 border-[var(--border-main)] pb-3 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[#19B56B]" />
              ADDITIONAL SKILLS
            </h3>

            {/* List of Skills */}
            <div className="flex flex-wrap gap-2.5 min-h-[40px] items-center">
              {skills.length === 0 ? (
                <div className="text-xs font-mono text-[var(--text-secondary)] italic">No additional skills added yet. Add custom skills below.</div>
              ) : (
                skills.map((s) => {
                  const style = LEVEL_COLORS[s.level] || LEVEL_COLORS.Intermediate;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] border ${style.border} ${style.bg} ${style.text} font-mono text-xs font-bold shadow-paper-xs`}
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] opacity-75 border-l border-current pl-1.5 uppercase">{s.level}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s.id)}
                        className="hover:text-red-600 transition-colors ml-1 cursor-pointer"
                        title="Remove skill"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Skill Form */}
            <div className="pt-2 border-t border-[var(--border-main)]/50">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter skill name (e.g. Python, Public Speaking)..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="flex-1 w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                />
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as SkillProficiencyLevel)}
                  className="w-full sm:w-auto rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                >
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSkill}
                  icon={<Plus className="h-3.5 w-3.5" />}
                  className="w-full sm:w-auto shrink-0 bg-[#FFC400]"
                >
                  Add Skill
                </Button>
              </div>
            </div>
          </Card>

          {/* SECTION 5: Certifications */}
          <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
              <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] flex items-center gap-2">
                <Award className="h-4 w-4 text-[#9C27B0]" />
                PROFESSIONAL CERTIFICATIONS & DIGITAL CREDENTIALS
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActivePage('certificates')}
                  className="bg-[#9C27B0] text-white text-xs"
                >
                  View Digital Certificates (Phase 3F)
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowCertForm(!showCertForm)}
                  icon={<Plus className="h-3.5 w-3.5" />}
                >
                  {showCertForm ? 'Cancel' : 'Add Manual Record'}
                </Button>
              </div>
            </div>

            {/* Add Certification Modal/Drawer Inline Form */}
            {showCertForm && (
              <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-4 animate-fade-in">
                <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">Add New Certification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="CERTIFICATION NAME *"
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="e.g. Certified Learning Professional"
                  />
                  <Input
                    label="ISSUING ORGANIZATION *"
                    type="text"
                    value={certOrg}
                    onChange={(e) => setCertOrg(e.target.value)}
                    placeholder="e.g. Association for Talent Development"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="ISSUE DATE *"
                    type="date"
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                  />
                  <Input
                    label="EXPIRY DATE (OPTIONAL)"
                    type="date"
                    value={certExpiryDate}
                    onChange={(e) => setCertExpiryDate(e.target.value)}
                  />
                  <Input
                    label="CREDENTIAL ID (OPTIONAL)"
                    type="text"
                    value={certCredentialId}
                    onChange={(e) => setCertCredentialId(e.target.value)}
                    placeholder="e.g. ATD-99482"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCertForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddCertification}
                    className="bg-[#FFC400]"
                  >
                    Save Certification
                  </Button>
                </div>
              </div>
            )}

            {/* List of Certifications */}
            <div className="space-y-3">
              {certifications.length === 0 ? (
                <div className="text-xs font-mono text-[var(--text-secondary)] italic py-2">No certifications recorded yet. Click "Add Certification" above to record your credentials.</div>
              ) : (
                certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-paper-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#9C27B0] shrink-0" />
                        <h4 className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase">{cert.name}</h4>
                      </div>
                      <p className="text-xs font-mono text-[var(--text-secondary)]">
                        Issued by: <strong className="text-[var(--text-primary)]">{cert.issuingOrganization}</strong>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-secondary)] pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#2F6BFF]" />
                          Issued: {cert.issueDate}
                        </span>
                        {cert.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#FF9800]" />
                            Expires: {cert.expiryDate}
                          </span>
                        )}
                        {cert.credentialId && (
                          <span className="bg-gray-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-[10px] font-bold text-[var(--text-primary)]">
                            ID: {cert.credentialId}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert.id)}
                      className="self-end sm:self-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                      title="Delete certification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

      </form>
    </div>
  );
}
