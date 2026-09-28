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

  // Load trainers and trainee's existing selection record
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const available = await getAvailableTrainers();
        if (isMounted) setTrainers(available);

        if (traineeId) {
          const activeRel = await getTraineeSelectedTrainer(traineeId);
          if (isMounted && activeRel) {
            setSelectedAssignment(activeRel.assignment);
            setActiveTrainerId(activeRel.trainer.uid);
          }
        }
      } catch (err) {
        console.warn('[FindTrainer] Load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [traineeId]);

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
  const filteredTrainers = useMemo(() => {
    return trainers.filter(t => {
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
    trainers,
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
    try {
      const record = await selectTrainerForTrainee(traineeId, traineeProfile, trainer);
      setSelectedAssignment(record);
      setActiveTrainerId(trainer.uid);

      setSuccessToast(`Successfully selected ${trainer.fullName} as your primary learning trainer!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.warn('[FindTrainer] Select error:', err);
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

      {/* Header Banner */}
      <div className="rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#992e9d] dark:text-slate-400 dark:hover:text-purple-300 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="font-semibold text-2xl md:text-3xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-[#992e9d] dark:text-purple-400" />
            Find a Trainer
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search and explore trainers based on expertise, competencies, and training programs.
          </p>
        </div>

        {/* Selected Trainer Pill Status */}
        {activeTrainerId && selectedAssignment && (
          <div className="p-3.5 rounded-[11px] border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-xs flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Trainer Selected</div>
              <div className="font-bold text-slate-900 dark:text-white">{selectedAssignment.trainerName}</div>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH BAR & FILTERS SECTION */}
      <div className="p-5 rounded-[11px] bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trainers by name, skill, competency, or expertise..."
            className="w-full pl-11 pr-10 py-3 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] truncate"
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Designation Filter */}
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] truncate"
          >
            <option value="">All Designations</option>
            {filterOptions.designations.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Competency Filter */}
          <select
            value={selectedCompetency}
            onChange={(e) => setSelectedCompetency(e.target.value)}
            className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] truncate"
          >
            <option value="">All Competencies</option>
            {filterOptions.competencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Skill Filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] truncate"
          >
            <option value="">All Skills</option>
            {filterOptions.skills.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Proficiency Level Filter */}
          <select
            value={selectedProficiency}
            onChange={(e) => setSelectedProficiency(e.target.value)}
            className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] truncate"
          >
            <option value="">All Proficiency Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          {/* Training Mode Filter */}
          <select
            value={selectedTrainingMode}
            onChange={(e) => setSelectedTrainingMode(e.target.value)}
            className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] truncate"
          >
            <option value="">All Delivery Modes</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((t) => {
            const isSelected = activeTrainerId === t.uid;
            const highestProficiency = t.competencies?.reduce((max, c) => {
              if (!c || !c.level) return max;
              const ranks: Record<SkillProficiencyLevel, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
              return (ranks[c.level] || 1) > (ranks[max] || 1) ? c.level : max;
            }, 'Intermediate' as SkillProficiencyLevel) || 'Advanced';

            const nameStr = t.fullName || 'Trainer Faculty';
            const initials = nameStr.split(' ').map(n => n[0] || '').join('').slice(0, 2) || 'TF';

            return (
              <div
                key={t.uid}
                className={`p-5 rounded-[11px] border transition-all bg-white dark:bg-[#0C1220] flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden group ${
                  isSelected
                    ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-[#992e9d]'
                }`}
              >
                <div className="space-y-3">

                  {/* Header: Photo & Name & Mode */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {t.profilePhoto ? (
                        <img
                          src={t.profilePhoto}
                          alt={nameStr}
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 font-bold text-sm flex items-center justify-center border border-purple-200 dark:border-purple-800">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-[#992e9d] transition-colors">
                          {nameStr}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.designation || 'Senior Faculty'}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{t.department || 'Training'}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shrink-0">
                      {t.preferredTrainingMode || 'Hybrid'}
                    </span>
                  </div>

                  {/* Organization & Years Experience */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="truncate max-w-[170px] font-medium">{t.organization || 'Capacity Connect'}</span>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">{t.yearsOfExperience || 5} Yrs Experience</span>
                  </div>

                  {/* Short Bio */}
                  {t.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                      "{t.bio}"
                    </p>
                  )}

                  {/* Skills Tags */}
                  {t.skills && t.skills.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Top Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {t.skills.slice(0, 3).map((sk, idx) => (
                          <span key={typeof sk === 'string' ? sk : idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {typeof sk === 'string' ? sk : (sk as any)?.name || 'Skill'}
                          </span>
                        ))}
                        {t.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium px-1">+{t.skills.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top Competencies & Highest Level */}
                  {t.competencies && t.competencies.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        <span>Competencies</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{highestProficiency} Level</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.competencies.slice(0, 2).map((c, idx) => {
                          if (!c) return null;
                          const cName = typeof c === 'string' ? c : (c.name || 'Competency');
                          const cLevel = typeof c === 'object' && c.level ? c.level : 'Intermediate';
                          return (
                            <span key={typeof c === 'object' && c.id ? c.id : idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300">
                              {cName} ({cLevel})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInspectedTrainer(t)}
                    className="py-2 px-3 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    View Profile
                  </button>

                  {isSelected ? (
                    <button
                      disabled
                      className="py-2 px-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1 cursor-default"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectTrainer(t)}
                      disabled={isSelecting}
                      className="py-2 px-3 rounded-full bg-[#992e9d] hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      Select Trainer
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 rounded-[12px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                {inspectedTrainer.profilePhoto ? (
                  <img
                    src={inspectedTrainer.profilePhoto}
                    alt={inspectedTrainer.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#992e9d]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 font-bold text-xl flex items-center justify-center border-2 border-[#992e9d]">
                    {(inspectedTrainer.fullName || 'Trainer Faculty').split(' ').map(n => n[0] || '').join('').slice(0, 2) || 'TF'}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{inspectedTrainer.fullName || 'Trainer Faculty'}</h2>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{inspectedTrainer.designation || 'Senior Faculty'} • {inspectedTrainer.department || 'Training'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{inspectedTrainer.organization || 'Capacity Connect'} ({inspectedTrainer.yearsOfExperience || 5} Yrs Experience)</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedTrainer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Bio */}
            {inspectedTrainer.bio && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Professional Bio</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-[#080D1A] p-3 rounded-[9px] border border-slate-200 dark:border-slate-800">
                  "{inspectedTrainer.bio}"
                </p>
              </div>
            )}

            {/* EXPERTISE SECTION */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Expertise & Competencies
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Area of Expertise:</span> <strong className="text-slate-900 dark:text-white">{inspectedTrainer.areaOfExpertise || 'Technical Training'}</strong></div>
                <div><span className="text-slate-400">Specialization:</span> <strong className="text-slate-900 dark:text-white">{inspectedTrainer.specialization || 'Capacity Building'}</strong></div>
              </div>

              {/* Skills list */}
              {inspectedTrainer.skills && inspectedTrainer.skills.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Technical Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedTrainer.skills.map((sk, idx) => (
                      <span key={typeof sk === 'string' ? sk : idx} className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60">
                        {typeof sk === 'string' ? sk : (sk as any)?.name || 'Skill'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Competencies table */}
              {inspectedTrainer.competencies && inspectedTrainer.competencies.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Declared Competencies:</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {inspectedTrainer.competencies.map((c, idx) => {
                      if (!c) return null;
                      const cName = typeof c === 'string' ? c : (c.name || 'Competency');
                      const cLevel = typeof c === 'object' && c.level ? c.level : 'Intermediate';
                      const cCat = typeof c === 'object' ? c.category : null;
                      const cCanTrain = typeof c === 'object' ? c.canTrain !== false : true;

                      return (
                        <div key={typeof c === 'object' && c.id ? c.id : idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-900 dark:text-white">{cName}</strong>
                            {cCat && <span className="text-[10px] text-slate-400 ml-2">({cCat})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#992e9d] dark:text-purple-300 font-bold text-[10px]">
                              {cLevel}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cCanTrain ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {cCanTrain ? 'Can Train: Yes' : 'Can Train: No'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* TRAINING OFFERINGS & PREFERENCES */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-[#992e9d] dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Training Programs & Delivery
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Preferred Mode:</span> <strong className="text-slate-900 dark:text-white">{inspectedTrainer.preferredTrainingMode || 'Hybrid'}</strong></div>
                {inspectedTrainer.trainerExperience && <div><span className="text-slate-400">Experience Summary:</span> <strong className="text-slate-900 dark:text-white">{inspectedTrainer.trainerExperience}</strong></div>}
              </div>

              {inspectedTrainer.trainingPrograms && inspectedTrainer.trainingPrograms.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Training Programs Handled:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedTrainer.trainingPrograms.map(p => (
                      <span key={p} className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-[#992e9d] dark:text-purple-300 text-xs font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectedTrainer.certifications && inspectedTrainer.certifications.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Certifications & Honors:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedTrainer.certifications.map(cert => (
                      <span key={cert} className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1">
                        <Award className="w-3 h-3" /> {cert}
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
                className="px-5 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>

              {activeTrainerId === inspectedTrainer.uid ? (
                <button
                  disabled
                  className="px-6 py-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-xs font-bold flex items-center gap-1 cursor-default"
                >
                  <CheckCircle2 className="w-4 h-4" /> Trainer Selected
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleSelectTrainer(inspectedTrainer);
                    setInspectedTrainer(null);
                  }}
                  disabled={isSelecting}
                  className="px-6 py-2 rounded-full bg-[#992e9d] hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Select Trainer
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
