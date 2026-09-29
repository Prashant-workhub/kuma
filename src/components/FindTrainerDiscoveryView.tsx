/**
 * Project Kuma - Trainee Trainer Discovery & Selection Workspace (SIH26075 Capacity Connect)
 * Allows Trainees to search, filter, view detailed profiles, and select trainers for their learning journey.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  GraduationCap,
  Building2,
  Award,
  Video,
  MapPin,
  Globe,
  ArrowLeft,
  X,
  CheckCircle2,
  Briefcase,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { UserSettings, TrainerProfile, TrainerAssignmentRecord, SkillProficiencyLevel } from '../types';
import { rankTrainersForTrainee } from '../utils/trainerMatching';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import {
  getAvailableTrainers,
  getTraineeSelectedTrainer,
  selectTrainerForTrainee
} from '../services/trainerDiscoveryService';

interface FindTrainerDiscoveryViewProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
  theme: 'light' | 'dark';
}

export default function FindTrainerDiscoveryView({
  settings,
  setActivePage,
  theme
}: FindTrainerDiscoveryViewProps) {
  const traineeProfile = settings.profile;
  const traineeId = traineeProfile.uid || 'trainee-current';
  const includeDemoTrainers = isDemoTraineeIdentity(traineeProfile.uid, traineeProfile.emailAddress);

  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<TrainerAssignmentRecord | null>(null);
  const [activeTrainerId, setActiveTrainerId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const [selectedTrainingMode, setSelectedTrainingMode] = useState('');

  // Selected Trainer for Detail Modal
  const [inspectedTrainer, setInspectedTrainer] = useState<TrainerProfile | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load trainers and trainee's existing selection record
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const available = await getAvailableTrainers(includeDemoTrainers);
        if (isMounted) setTrainers(available);

        if (traineeId) {
          const activeRel = await getTraineeSelectedTrainer(traineeId, includeDemoTrainers);
          if (isMounted && activeRel) {
            setSelectedAssignment(activeRel.assignment);
            setActiveTrainerId(activeRel.trainer.uid);
          }
        }
      } catch (err) {
        console.warn('[FindTrainer] Load error:', err);
        if (isMounted) setLoadError('Unable to load trainers or your saved selection. Check the connection and try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [traineeId, includeDemoTrainers]);

  // Extract unique filter options present in current trainer dataset
  const filterOptions = useMemo(() => {
    const depts = new Set<string>();
    const desigs = new Set<string>();
    const comps = new Set<string>();
    const sks = new Set<string>();
    const modes = new Set<string>();

    trainers.forEach(t => {
      if (!t) return;
      if (t.department) depts.add(t.department);
      if (t.designation) desigs.add(t.designation);
      if (t.preferredTrainingMode) modes.add(t.preferredTrainingMode);
      if (t.skills && Array.isArray(t.skills)) {
        t.skills.forEach(s => { if (typeof s === 'string') sks.add(s); });
      }
      if (t.competencies && Array.isArray(t.competencies)) {
        t.competencies.forEach(c => {
          if (c && typeof c === 'object' && c.name) comps.add(c.name);
          else if (typeof c === 'string') comps.add(c);
        });
      }
    });

    return {
      departments: Array.from(depts),
      designations: Array.from(desigs),
      competencies: Array.from(comps),
      skills: Array.from(sks),
      modes: Array.from(modes)
    };
  }, [trainers]);

  // Dynamic search & filtering
  const rankedTrainers = useMemo(
    () => rankTrainersForTrainee(trainers, traineeProfile.competencies || []),
    [trainers, traineeProfile.competencies]
  );

  const filteredTrainers = useMemo(() => {
    return rankedTrainers.filter(({ trainer: t }) => {
      if (!t) return false;

      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = (t.fullName || '').toLowerCase().includes(q);
        const matchDept = (t.department || '').toLowerCase().includes(q);
        const matchDesig = (t.designation || '').toLowerCase().includes(q);
        const matchArea = (t.areaOfExpertise || '').toLowerCase().includes(q);
        const matchSpec = (t.specialization || '').toLowerCase().includes(q);
        const matchSkill = t.skills?.some(s => typeof s === 'string' && s.toLowerCase().includes(q));
        const matchComp = t.competencies?.some(c => {
          if (!c) return false;
          const cName = typeof c === 'string' ? c : c.name;
          return cName && typeof cName === 'string' && cName.toLowerCase().includes(q);
        });
        const matchProg = t.trainingPrograms?.some(p => typeof p === 'string' && p.toLowerCase().includes(q));

        if (!matchName && !matchDept && !matchDesig && !matchArea && !matchSpec && !matchSkill && !matchComp && !matchProg) {
          return false;
        }
      }

      // 2. Department Filter
      if (selectedDepartment && t.department !== selectedDepartment) return false;

      // 3. Designation Filter
      if (selectedDesignation && t.designation !== selectedDesignation) return false;

      // 4. Competency Filter
      if (selectedCompetency && !t.competencies?.some(c => {
        if (!c) return false;
        const cName = typeof c === 'string' ? c : c.name;
        return cName === selectedCompetency;
      })) return false;

      // 5. Skill Filter
      if (selectedSkill && !t.skills?.includes(selectedSkill)) return false;

      // 6. Proficiency Level Filter
      if (selectedProficiency && !t.competencies?.some(c => c && typeof c === 'object' && c.level === selectedProficiency)) return false;

      // 7. Training Mode Filter
      if (selectedTrainingMode && t.preferredTrainingMode !== selectedTrainingMode) return false;

      return true;
    });
  }, [
    rankedTrainers,
    searchQuery,
    selectedDepartment,
    selectedDesignation,
    selectedCompetency,
    selectedSkill,
    selectedProficiency,
    selectedTrainingMode
  ]);

  const hasActiveFilters = searchQuery || selectedDepartment || selectedDesignation || selectedCompetency || selectedSkill || selectedProficiency || selectedTrainingMode;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedDesignation('');
    setSelectedCompetency('');
    setSelectedSkill('');
    setSelectedProficiency('');
    setSelectedTrainingMode('');
  };

  // Select a trainer action
  const handleSelectTrainer = async (trainer: TrainerProfile) => {
    setIsSelecting(true);
    setSelectionError(null);
    try {
      const record = await selectTrainerForTrainee(traineeId, traineeProfile, trainer, includeDemoTrainers);
      setSelectedAssignment(record);
      setActiveTrainerId(trainer.uid);

      setSuccessToast(`Successfully selected ${trainer.fullName} as your primary learning trainer!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.warn('[FindTrainer] Select error:', err);
      setSelectionError('Unable to save this trainer selection. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 p-4 md:p-8 select-none font-sans">

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-[11px] bg-emerald-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadError && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {loadError}
        </div>
      )}

      {selectionError && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {selectionError}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Find a trainer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search and explore trainers based on expertise, competencies, and training programs.
          </p>
        </div>

        {/* Selected Trainer Status */}
        {activeTrainerId && selectedAssignment && (
          <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs flex items-center gap-3 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Selected trainer</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{selectedAssignment.trainerName}</div>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH BAR & FILTERS SECTION */}
      <div className="p-4 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-3">

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trainers by name, skill, competency, or expertise..."
            className="w-full pl-10 pr-9 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 truncate"
          >
            <option value="">All departments</option>
            {filterOptions.departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Designation Filter */}
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 truncate"
          >
            <option value="">All designations</option>
            {filterOptions.designations.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Competency Filter */}
          <select
            value={selectedCompetency}
            onChange={(e) => setSelectedCompetency(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 truncate"
          >
            <option value="">All competencies</option>
            {filterOptions.competencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Skill Filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 truncate"
          >
            <option value="">All skills</option>
            {filterOptions.skills.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Proficiency Level Filter */}
          <select
            value={selectedProficiency}
            onChange={(e) => setSelectedProficiency(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 truncate"
          >
            <option value="">All proficiency levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          {/* Training Mode Filter */}
          <select
            value={selectedTrainingMode}
            onChange={(e) => setSelectedTrainingMode(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 truncate"
          >
            <option value="">All delivery modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>

        </div>

        {/* Active Filters Clear Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <strong>{filteredTrainers.length}</strong> of {trainers.length} available trainers
            </span>
            <button
              onClick={handleClearFilters}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* TRAINER CARDS GRID */}
      {loading ? (
        <div className="p-12 text-center text-xs font-medium text-slate-400">
          Loading available capacity building trainers...
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="p-12 text-center rounded-[11px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {trainers.length === 0
              ? 'No trainers available yet.'
              : searchQuery
                ? 'No trainers match your search.'
                : 'No trainers match the selected filters.'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search criteria or clearing filters to discover available trainers.'
              : 'Trainers will appear here once registered in Capacity Connect.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-full bg-[#992e9d] text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainers.map(({ trainer: t, score, breakdown, matchedCompetencies, reason }) => {
            const isSelected = activeTrainerId === t.uid;
            const nameStr = t.fullName || 'Trainer Faculty';
            const initials = nameStr.split(' ').map(n => n[0] || '').join('').slice(0, 2) || 'TF';
            const skillsList = t.skills ? t.skills.map(s => typeof s === 'string' ? s : (s as any)?.name).filter(Boolean) : [];

            return (
              <div
                key={t.uid}
                className={`p-5 rounded-lg border transition-all bg-white dark:bg-[#0C1220] flex flex-col justify-between space-y-4 ${isSelected
                  ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-purple-500/40'
                  }`}
              >
                <div className="space-y-3">

                  {/* Header: Avatar, Name & Role */}
                  <div className="flex items-start gap-3">
                    {t.profilePhoto ? (
                      <img
                        src={t.profilePhoto}
                        alt={nameStr}
                        className="w-11 h-11 rounded-full object-cover border border-purple-500/30"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-medium text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800 shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {nameStr}
                      </h3>
                      <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                        {t.designation || 'Senior Faculty'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {t.department || 'Training Unit'} • {t.organization || 'Capacity Connect'}
                      </p>
                    </div>
                  </div>

                  {/* Experience & Mode */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>{t.yearsOfExperience || 5} years experience</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t.preferredTrainingMode || 'Hybrid'}</span>
                  </div>

                  <div className="rounded-md border border-purple-200/60 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/25 p-2.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-purple-800 dark:text-purple-200">
                      <span>Competency match</span><span>{score}%</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{reason}</p>
                    <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      Alignment {breakdown.competency}/40 · Proficiency {breakdown.proficiency}/30 · Experience {breakdown.experience}/15 · Qualification {breakdown.qualification}/15
                    </p>
                    {matchedCompetencies.length > 0 && <p className="mt-1 text-[10px] text-purple-700 dark:text-purple-300">Matches: {matchedCompetencies.join(', ')}</p>}
                  </div>

                  {/* Short Bio */}
                  {t.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {t.bio}
                    </p>
                  )}

                  {/* Top Skills */}
                  {skillsList.length > 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-1 truncate">
                      {skillsList.slice(0, 3).join(' • ')}
                      {skillsList.length > 3 && <span className="text-slate-400"> • +{skillsList.length - 3}</span>}
                    </div>
                  )}

                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInspectedTrainer(t)}
                    className="py-1.5 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    View profile
                  </button>

                  {isSelected ? (
                    <button
                      disabled
                      className="py-1.5 px-3 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300/50 text-xs font-medium flex items-center justify-center gap-1 cursor-default"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectTrainer(t)}
                      disabled={isSelecting}
                      className="py-1.5 px-3 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Select trainer
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED TRAINER PROFILE MODAL */}
      {inspectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                {inspectedTrainer.profilePhoto ? (
                  <img
                    src={inspectedTrainer.profilePhoto}
                    alt={inspectedTrainer.fullName}
                    className="w-14 h-14 rounded-full object-cover border border-purple-500/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-medium text-lg flex items-center justify-center border border-purple-200 dark:border-purple-800">
                    {(inspectedTrainer.fullName || 'Trainer Faculty').split(' ').map(n => n[0] || '').join('').slice(0, 2) || 'TF'}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{inspectedTrainer.fullName || 'Trainer Faculty'}</h2>
                  <p className="text-xs text-purple-600 dark:text-purple-400">{inspectedTrainer.designation || 'Senior Faculty'} • {inspectedTrainer.department || 'Training Unit'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{inspectedTrainer.organization || 'Capacity Connect'} ({inspectedTrainer.yearsOfExperience || 5} years experience)</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedTrainer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Bio */}
            {inspectedTrainer.bio && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">About</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#080D1A] p-3 rounded-md border border-slate-200 dark:border-slate-800">
                  {inspectedTrainer.bio}
                </p>
              </div>
            )}

            {/* EXPERTISE SECTION */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-medium text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Expertise & competencies
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Area of expertise:</span> <span className="text-slate-900 dark:text-slate-100 font-medium">{inspectedTrainer.areaOfExpertise || 'Technical Training'}</span></div>
                <div><span className="text-slate-400">Specialization:</span> <span className="text-slate-900 dark:text-slate-100 font-medium">{inspectedTrainer.specialization || 'Capacity Building'}</span></div>
              </div>

              {/* Skills list */}
              {inspectedTrainer.skills && inspectedTrainer.skills.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Technical skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedTrainer.skills.map((sk, idx) => (
                      <span key={typeof sk === 'string' ? sk : idx} className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200/50 dark:border-purple-800/50">
                        {typeof sk === 'string' ? sk : (sk as any)?.name || 'Skill'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Competencies table */}
              {inspectedTrainer.competencies && inspectedTrainer.competencies.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Declared competencies:</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {inspectedTrainer.competencies.map((c, idx) => {
                      if (!c) return null;
                      const cName = typeof c === 'string' ? c : (c.name || 'Competency');
                      const cLevel = typeof c === 'object' && c.level ? c.level : 'Intermediate';
                      const cCat = typeof c === 'object' ? c.category : null;

                      return (
                        <div key={typeof c === 'object' && c.id ? c.id : idx} className="p-2.5 rounded-md bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100">{cName}</span>
                            {cCat && <span className="text-[10px] text-slate-400 ml-2">({cCat})</span>}
                          </div>
                          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-medium text-[11px]">
                            {cLevel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* TRAINING OFFERINGS & PREFERENCES */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-medium text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Training programs & delivery
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Preferred mode:</span> <span className="text-slate-900 dark:text-slate-100 font-medium">{inspectedTrainer.preferredTrainingMode || 'Hybrid'}</span></div>
                {inspectedTrainer.trainerExperience && <div><span className="text-slate-400">Experience summary:</span> <span className="text-slate-900 dark:text-slate-100 font-medium">{inspectedTrainer.trainerExperience}</span></div>}
              </div>

              {inspectedTrainer.trainingPrograms && inspectedTrainer.trainingPrograms.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Training programs handled:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedTrainer.trainingPrograms.map(p => (
                      <span key={p} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                onClick={() => setInspectedTrainer(null)}
                className="px-4 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>

              {activeTrainerId === inspectedTrainer.uid ? (
                <button
                  disabled
                  className="px-4 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300/50 text-xs font-medium flex items-center gap-1 cursor-default"
                >
                  <CheckCircle2 className="w-4 h-4" /> Trainer selected
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleSelectTrainer(inspectedTrainer);
                    setInspectedTrainer(null);
                  }}
                  disabled={isSelecting}
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Select trainer
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
