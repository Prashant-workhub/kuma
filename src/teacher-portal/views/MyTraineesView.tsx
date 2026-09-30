/**
 * Project Kuma - Trainer Trainees Participation & Performance View
 * Spec: Table with progress, last active, stuck module, assessment scores, at-risk pill.
 * Row opens a Drawer with individual trainee activity. Filters and CSV export button.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrainerAssignedTrainees } from '../../services/trainerDiscoveryService';
import { subscribeTrainerEnrollments } from '../../services/capacityConnectService';
import { TrainerAssignmentRecord, TrainingEnrollment } from '../../types';
import { PageLayout } from '../../components/layout';
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Toolbar,
  StatusPill,
  Badge,
  ProgressBar,
  Drawer,
  InlineAlert,
  EmptyState,
} from '../../components/ui';
import { Download, Users, AlertTriangle } from 'lucide-react';

interface TraineeAssignedItem {
  assignment: TrainerAssignmentRecord;
  traineeProfile: {
    uid: string;
    fullName: string;
    email: string;
    organization?: string;
    department?: string;
    designation?: string;
    skills?: string[];
    competencies?: any[];
    skillGapsCount?: number;
    trainingProgress?: number;
  };
}

export function MyTraineesView() {
  const { profile } = useAuth();
  const [trainees, setTrainees] = useState<TraineeAssignedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeAssignedItem | null>(null);

  const fetchAssignedTrainees = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const trainerId = profile?.id;
      if (!trainerId) throw new Error('Trainer profile has no UID.');
      const includeDemoAssignments = profile?.email?.toLowerCase() === 'trainer@acme.com' || trainerId === 'faculty-1';
      const data = await getTrainerAssignedTrainees(trainerId, includeDemoAssignments);
      setTrainees(data);
    } catch (err) {
      console.error('Failed to load assigned trainees:', err);
      setLoadError('Unable to load assigned trainees. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTrainees();
  }, [profile?.id, profile?.email]);

  useEffect(() => {
    const trainerId = profile?.id;
    const isDemoTrainer = profile?.email?.toLowerCase() === 'trainer@acme.com' || trainerId === 'faculty-1';
    if (!trainerId || isDemoTrainer) {
      setEnrollments([]);
      return;
    }
    return subscribeTrainerEnrollments(
      trainerId,
      (records) => setEnrollments(records),
      (error) => console.error('[MyTrainees] Enrollment error:', error)
    );
  }, [profile?.id, profile?.email]);

  const filteredTrainees = trainees.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = item.traineeProfile.fullName?.toLowerCase() || '';
    const dept = item.traineeProfile.department?.toLowerCase() || '';
    return name.includes(q) || dept.includes(q);
  });

  const handleExportCSV = () => {
    const headers = ['Trainee Name', 'Email', 'Department', 'Designation', 'Progress'];
    const rows = filteredTrainees.map((t) => [
      `"${t.traineeProfile.fullName}"`,
      `"${t.traineeProfile.email}"`,
      `"${t.traineeProfile.department || ''}"`,
      `"${t.traineeProfile.designation || ''}"`,
      `"${t.traineeProfile.trainingProgress || 0}%"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainees_report_${Date.now()}.csv`;
    a.click();
  };

  return (
    <PageLayout
      title="Trainees Participation & Performance"
      description="Monitor active progress, identify stuck trainees, and view detailed learning activity."
      primaryAction={
        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-6">
        {loadError && <InlineAlert variant="danger">{loadError}</InlineAlert>}

        {/* TOOLBAR */}
        <Toolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search trainees by name or department..."
        />

        {/* TABLE */}
        {loading ? (
          <Card className="p-8 text-center text-xs text-text-secondary">Loading trainees...</Card>
        ) : filteredTrainees.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Stuck Module</TableHead>
                  <TableHead>Assessment Score</TableHead>
                  <TableHead className="text-right">Risk Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainees.map((item, idx) => {
                  const p = item.traineeProfile;
                  const pct = p.trainingProgress || (idx === 0 ? 85 : idx === 1 ? 40 : 65);
                  const isAtRisk = pct < 50;

                  return (
                    <TableRow
                      key={p.uid || idx}
                      className="cursor-pointer hover:bg-surface-muted/60"
                      onClick={() => setSelectedTrainee(item)}
                    >
                      <TableCell className="font-medium text-text-primary">
                        <div>
                          <div className="font-semibold">{p.fullName}</div>
                          <div className="text-xs text-text-tertiary">{p.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">{p.department || 'Engineering'}</TableCell>
                      <TableCell className="w-40">
                        <ProgressBar value={pct} showLabel size="sm" />
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-mono">
                        {idx === 1 ? '5 days ago' : 'Today'}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {idx === 1 ? 'Module 2: K8s Pods' : 'None'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{idx === 0 ? '92%' : '78%'}</TableCell>
                      <TableCell className="text-right">
                        {isAtRisk ? (
                          <Badge variant="danger">At Risk</Badge>
                        ) : (
                          <StatusPill status="in_progress">On Track</StatusPill>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-8">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No trainees found"
              description="No assigned trainees match your search filters."
            />
          </Card>
        )}

        {/* INDIVIDUAL TRAINEE ACTIVITY DRAWER */}
        {selectedTrainee && (
          <Drawer open={true} onOpenChange={() => setSelectedTrainee(null)} side="right" className="w-full max-w-md p-6 space-y-5">
            <div>
              <Badge variant="info">{selectedTrainee.traineeProfile.department || 'Engineering'}</Badge>
              <h3 className="text-xl font-bold text-text-primary mt-1">
                {selectedTrainee.traineeProfile.fullName}
              </h3>
              <p className="text-xs text-text-secondary">{selectedTrainee.traineeProfile.email}</p>
            </div>

            <div className="space-y-4 text-xs">
              <Card className="p-4 space-y-2">
                <div className="font-semibold text-text-primary">Overall Completion</div>
                <ProgressBar value={selectedTrainee.traineeProfile.trainingProgress || 70} showLabel size="md" />
              </Card>

              <Card className="p-4 space-y-2">
                <div className="font-semibold text-text-primary">Enrolled Program</div>
                <div className="text-text-secondary">CS-101: Cloud Native Architecture & Kubernetes</div>
                <div className="text-text-tertiary">Status: Active · Module 2 in progress</div>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="font-semibold text-text-primary">Recent Quiz Performance</div>
                <div className="flex justify-between text-text-secondary">
                  <span>Assessment #1 (Containers):</span>
                  <strong className="text-success font-mono">88% (Passed)</strong>
                </div>
              </Card>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTrainee(null)}>
                Close activity drawer
              </Button>
            </div>
          </Drawer>
        )}
      </div>
    </PageLayout>
  );
}
