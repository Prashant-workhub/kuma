/**
 * Project Kuma - Trainee Trainer & Course Discovery Workspace (SIH26075 Capacity Connect)
 * Allows Trainees to search, filter, view detailed profiles/syllabi, and select trainers/courses.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  UserCheck,
  GraduationCap,
  Building2,
  Award,
  Video,
  MapPin,
  CheckCircle2,
  Briefcase,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  Clock,
  ArrowLeft,
  X,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { UserSettings, TrainerProfile, TrainerAssignmentRecord } from '../types';
import { rankTrainersForTrainee } from '../utils/trainerMatching';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import {
  getAvailableTrainers,
  getTraineeSelectedTrainer,
  selectTrainerForTrainee
} from '../services/trainerDiscoveryService';
import { PageLayout, TwoColumnLayout } from './layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
  Badge,
  StatusPill,
  Toolbar,
  Select,
  EmptyState,
  InlineAlert,
  Dialog,
  DialogContent,
} from './ui';

interface FindTrainerDiscoveryViewProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
  theme?: 'light' | 'dark';
}

export default function FindTrainerDiscoveryView({
  settings,
  setActivePage,
}: FindTrainerDiscoveryViewProps) {
  const traineeProfile = settings.profile;
  const traineeId = traineeProfile.uid || 'trainee-current';
  const includeDemoTrainers = isDemoTraineeIdentity(traineeProfile.uid, traineeProfile.emailAddress);

  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<TrainerAssignmentRecord | null>(null);
  const [activeTrainerId, setActiveTrainerId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('q') || '';
    }
    return '';
  });
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('dept') || '';
    }
    return '';
  });
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Selected Trainer for Detail Modal (TwoColumnLayout)
  const [inspectedTrainer, setInspectedTrainer] = useState<TrainerProfile | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reflect filters in URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) params.set('q', searchQuery);
    else params.delete('q');

    if (selectedDepartment) params.set('dept', selectedDepartment);
    else params.delete('dept');

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, selectedDepartment]);

  // Load trainers
  const handleReloadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const available = await getAvailableTrainers(includeDemoTrainers);
      setTrainers(available);

      if (traineeId) {
        const activeRel = await getTraineeSelectedTrainer(traineeId, includeDemoTrainers);
        if (activeRel) {
          setSelectedAssignment(activeRel.assignment);
          setActiveTrainerId(activeRel.trainer.uid);
        }
      }
    } catch (err) {
      console.warn('[FindTrainer] Load error:', err);
      setLoadError('Unable to load trainers. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [traineeId, includeDemoTrainers]);

  useEffect(() => {
    handleReloadData();
  }, [handleReloadData]);

  // Filter options
  const departmentsList = useMemo(() => {
    const depts = new Set<string>();
    trainers.forEach((t) => {
      if (t.department) depts.add(t.department);
    });
    return Array.from(depts);
  }, [trainers]);

  // Ranked & Filtered Trainers
  const rankedTrainers = useMemo(
    () => rankTrainersForTrainee(trainers, traineeProfile.competencies || []),
    [trainers, traineeProfile.competencies]
  );

  const filteredTrainers = useMemo(() => {
    return rankedTrainers.filter(({ trainer: t }) => {
      if (!t) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = (t.fullName || '').toLowerCase().includes(q);
        const matchDept = (t.department || '').toLowerCase().includes(q);
        const matchDesig = (t.designation || '').toLowerCase().includes(q);
        const matchSpec = (t.specialization || '').toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchDesig && !matchSpec) return false;
      }
      if (selectedDepartment && t.department !== selectedDepartment) return false;
      return true;
    });
  }, [rankedTrainers, searchQuery, selectedDepartment]);

  const handleSelectTrainer = async (trainer: TrainerProfile) => {
    setIsSelecting(true);
    setSelectionError(null);
    try {
      const record = await selectTrainerForTrainee(traineeId, traineeProfile, trainer, includeDemoTrainers);
      setSelectedAssignment(record);
      setActiveTrainerId(trainer.uid);
      setSuccessToast(`Successfully enrolled with trainer ${trainer.fullName}!`);
      setTimeout(() => setSuccessToast(null), 4000);
      setInspectedTrainer(null);
    } catch (err: any) {
      setSelectionError('Unable to save selection. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <PageLayout
      title="Discover"
      description="Browse courses and faculty trainers matched to your competency gaps."
    >
      <div className="space-y-6">
        {/* Toast Alerts */}
        {successToast && (
          <InlineAlert variant="success" onClose={() => setSuccessToast(null)}>
            {successToast}
          </InlineAlert>
        )}
        {loadError && (
          <InlineAlert
            variant="danger"
            action={
              <Button size="sm" variant="secondary" onClick={handleReloadData}>
                Retry
              </Button>
            }
          >
            {loadError}
          </InlineAlert>
        )}

        {/* TOOLBAR: Search, Filters as Popover/Panel, Sort */}
        <Toolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search courses, trainers, skills..."
          filters={
            <div className="flex items-center gap-2">
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                options={[
                  { value: '', label: 'All Departments' },
                  ...departmentsList.map((d) => ({ value: d, label: d })),
                ]}
                className="w-44"
              />
              <Button
                variant={showFilterPanel ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Filters
              </Button>
            </div>
          }
        />

        {/* Filter Panel (Collapsible) */}
        {showFilterPanel && (
          <Card className="p-4 bg-surface-muted border-border space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
              <span>Filter catalog</span>
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSelectedDepartment(''); }}>
                Clear filters
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Department</label>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  options={[
                    { value: '', label: 'All Departments' },
                    ...departmentsList.map((d) => ({ value: d, label: d })),
                  ]}
                />
              </div>
            </div>
          </Card>
        )}

        {/* RESULTS: Restrained grid / Compact rows with consistent card anatomy */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-5 animate-pulse h-48 bg-surface-muted" />
            ))}
          </div>
        ) : filteredTrainers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrainers.map((matchItem) => {
              const { trainer: t, score, matchedCompetencies } = matchItem;
              const isSelected = activeTrainerId === t.uid;
              const primaryComp = matchedCompetencies[0];
              const gapLine = primaryComp
                ? `Builds ${primaryComp} competency`
                : `Comprehensive ${t.department || 'Technical'} program`;

              return (
                <Card
                  key={t.uid}
                  className={`flex flex-col justify-between p-5 space-y-4 hover:border-primary/50 transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header line: Title + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="info">{t.department || 'Engineering'}</Badge>
                      {isSelected ? (
                        <StatusPill status="completed">Selected</StatusPill>
                      ) : (
                        <span className="text-xs font-semibold text-success font-mono">
                          {score}% Match
                        </span>
                      )}
                    </div>

                    {/* Consistent Card Anatomy */}
                    <div>
                      <h3 className="font-semibold text-text-primary text-base line-clamp-1">
                        {t.specialization || `${t.fullName} Course`}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                        Trainer: <strong className="text-text-primary">{t.fullName}</strong>
                      </p>
                    </div>

                    {/* Gap Relevance Line */}
                    <div className="rounded-control bg-surface-muted p-2 text-xs text-text-secondary border border-border/40">
                      <Sparkles className="h-3.5 w-3.5 text-primary inline mr-1" aria-hidden="true" />
                      {gapLine}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-tertiary flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> 12 hours · Intermediate
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInspectedTrainer(t)}
                    >
                      View details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No courses or trainers found"
              description="Try adjusting your search criteria or clearing filters to see all available options."
              action={
                <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedDepartment(''); }}>
                  Reset filters
                </Button>
              }
            />
          </Card>
        )}

        {/* SCREEN 3: COURSE / TRAINER DETAIL MODAL (TwoColumnLayout) */}
        {inspectedTrainer && (
          <Dialog open={true} onOpenChange={() => setInspectedTrainer(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <TwoColumnLayout
                main={
                  <div className="space-y-6">
                    <div>
                      <Badge variant="info" className="mb-2">{inspectedTrainer.department}</Badge>
                      <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
                        {inspectedTrainer.specialization || `${inspectedTrainer.fullName}'s Masterclass`}
                      </h2>
                      <p className="text-sm text-text-secondary mt-1">
                        {inspectedTrainer.bio || 'Comprehensive structured competency development program aligned with corporate career paths.'}
                      </p>
                    </div>

                    {/* Syllabus (Module list with types and durations) */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-text-primary border-b border-border pb-2">
                        Course Syllabus
                      </h3>
                      <div className="space-y-2">
                        {[
                          { title: 'Module 1: Foundations & Core Architecture', type: 'Video & Reading', duration: '2 hours' },
                          { title: 'Module 2: Practical Implementation & Workflow', type: 'Interactive Lab', duration: '4 hours' },
                          { title: 'Module 3: Advanced Optimization & Best Practices', type: 'PDF Documentation', duration: '3 hours' },
                          { title: 'Module 4: Final Capstone & Competency Evaluation', type: 'Graded Assessment', duration: '3 hours' },
                        ].map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-container border border-border bg-surface-muted text-xs">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                              <span className="font-medium text-text-primary">{m.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-tertiary">
                              <span>{m.type}</span>
                              <span className="font-mono">{m.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Competencies and expected level gains */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-text-primary border-b border-border pb-2">
                        Expected Competency Gains
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(inspectedTrainer.competencies || [{ name: 'Technical Proficiency', level: 'L3' }]).map((comp: any, idx) => {
                          const cName = typeof comp === 'string' ? comp : comp.name;
                          return (
                            <div key={idx} className="p-3 rounded-container border border-border bg-surface text-xs space-y-1">
                              <div className="font-semibold text-text-primary">{cName}</div>
                              <div className="text-text-secondary flex items-center justify-between">
                                <span>Level Gain:</span>
                                <Badge variant="success">Level 2 → Level 3</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                }
                aside={
                  <div className="space-y-5 p-4 rounded-container border border-border bg-surface-muted">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-text-primary">Trainer Summary</h4>
                      <div className="text-xs text-text-secondary space-y-1">
                        <div><strong>Name:</strong> {inspectedTrainer.fullName}</div>
                        <div><strong>Designation:</strong> {inspectedTrainer.designation}</div>
                        <div><strong>Experience:</strong> {inspectedTrainer.yearsOfExperience || 5}+ years</div>
                        <div><strong>Rating:</strong> <span className="inline-flex items-center gap-1 font-medium">4.9 <Star className="h-3.5 w-3.5 text-warning fill-warning" aria-hidden="true" /></span></div>
                      </div>
                    </div>

                    {/* Match Explanation */}
                    <div className="rounded-control bg-primary/10 border border-primary/20 p-3 text-xs space-y-1">
                      <div className="font-semibold text-primary flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Why matched?
                      </div>
                      <p className="text-text-secondary leading-normal">
                        This course builds target competencies required for your role designation with verified trainer experience.
                      </p>
                    </div>

                    {/* Prerequisites */}
                    <div className="space-y-1 text-xs">
                      <h5 className="font-semibold text-text-primary">Prerequisites</h5>
                      <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                        <li>Basic understanding of department concepts</li>
                        <li>Completion of onboarding module</li>
                      </ul>
                    </div>

                    {/* Enroll Action Panel */}
                    <div className="pt-3 border-t border-border space-y-2">
                      {selectionError && (
                        <InlineAlert variant="danger">{selectionError}</InlineAlert>
                      )}
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full justify-center"
                        isLoading={isSelecting}
                        onClick={() => handleSelectTrainer(inspectedTrainer)}
                      >
                        Enroll in Course
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setInspectedTrainer(null)}
                      >
                        Close preview
                      </Button>
                    </div>
                  </div>
                }
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageLayout>
  );
}
