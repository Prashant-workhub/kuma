/**
 * Project Kuma - Growth & Skill Gap View
 * Spec: PageLayout + Tabs (Competencies table with level bars, Timeline, Skill gap radar, Certificates)
 */

import React, { useState, useMemo } from 'react';
import { UserSettings, TraineeCompetency, SkillProficiencyLevel, RoleSkillGapRecord, TrainingCertificate, Quiz } from '../types';
import {
  calculateDesignationSkillGaps,
  LEVEL_TO_NUMERIC,
} from '../utils/competencyUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { PageLayout } from './layout';
import { ChartCard, RadarChart, LineChart } from './charts';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ProgressBar,
  StatusPill,
  Badge,
} from './ui';
import { Target, TrendingUp, Award, Award as CertificateIcon, Clock, CheckCircle2 } from 'lucide-react';

interface SkillGapViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  setActivePage: (page: any) => void;
  theme?: 'light' | 'dark';
  onTakeAssessment?: (quiz: Quiz) => void;
  onViewCertificate?: (cert: TrainingCertificate) => void;
}

export default function SkillGapView({
  settings,
  setActivePage,
}: SkillGapViewProps) {
  const traineeId = settings.profile.uid || '';
  const isDemoTrainee = isDemoTraineeIdentity(traineeId, settings.profile.emailAddress);
  const competencies = useMemo(() => settings.profile.competencies || [], [settings.profile.competencies]);

  const [activeTab, setActiveTab] = useState('competencies');

  // Calculate gaps
  const designationGaps = useMemo(() => {
    return calculateDesignationSkillGaps(competencies, null, []);
  }, [competencies]);

  const activeGaps = useMemo(() => designationGaps.filter((g) => g.gap > 0), [designationGaps]);

  // Certificates list
  const certificates: TrainingCertificate[] = useMemo(() => {
    return [
      {
        id: 'KUMA-CERT-2026-8891',
        userId: traineeId,
        userName: settings.profile.fullName || 'Trainee Learner',
        courseId: 'course-101',
        courseCode: 'CS-101',
        courseName: 'Cloud Native Architecture & Kubernetes',
        organization: 'Acme Corporate Learning Board',
        issueDate: '2026-08-15',
        completionDate: '2026-08-15',
        verified: true,
        verificationUrl: 'https://kuma.corp/verify/KUMA-CERT-2026-8891',
      },
    ];
  }, [traineeId, settings.profile.fullName]);

  return (
    <PageLayout
      title="Growth & Competency Development"
      description="Monitor your skill progression, track history, and review awarded certificates."
    >
      <div className="space-y-6">
        {/* Growth Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="competencies">Competencies</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="skill-gap">Skill gap (Radar)</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          {/* TAB 1: COMPETENCIES (Current vs Required table with level bars) */}
          <TabsContent value="competencies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Competencies & Level Progression</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competency</TableHead>
                    <TableHead>Current Level</TableHead>
                    <TableHead>Target Level</TableHead>
                    <TableHead>Progress Bar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designationGaps.map((gapRecord) => {
                    const currentNum = LEVEL_TO_NUMERIC[gapRecord.currentLevel] || 1;
                    const targetNum = LEVEL_TO_NUMERIC[gapRecord.requiredLevel] || 4;
                    const pct = Math.min(100, Math.round((currentNum / targetNum) * 100));
                    const isMet = gapRecord.gap <= 0;

                    return (
                      <TableRow key={gapRecord.competencyId}>
                        <TableCell className="font-medium text-text-primary">
                          {gapRecord.competencyName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">{gapRecord.currentLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{gapRecord.requiredLevel}</Badge>
                        </TableCell>
                        <TableCell className="w-48">
                          <ProgressBar value={pct} showLabel size="sm" />
                        </TableCell>
                        <TableCell>
                          <StatusPill status={isMet ? 'completed' : 'in_progress'}>
                            {isMet ? 'Target Met' : `${gapRecord.gap} level gap`}
                          </StatusPill>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: TIMELINE (Per-competency history chart / log) */}
          <TabsContent value="timeline" className="space-y-4">
            <ChartCard
              title="Competency Growth Timeline"
              description="Historical progression of assessed skill levels over time."
              tableData={[
                { label: 'Jul', value: 1 },
                { label: 'Aug', value: 2 },
                { label: 'Sep', value: 3 },
              ]}
              tableHeaders={['label', 'value']}
              exportFileName="competency-growth-timeline"
            >
              <LineChart
                data={[
                  { label: 'Jul', value: 1 },
                  { label: 'Aug', value: 2 },
                  { label: 'Sep', value: 3 },
                ]}
                unit=" Level"
                formatType="integer"
                axisTitle="Skill Proficiency Level"
              />
            </ChartCard>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-text-primary">Competency Progression History</h3>
              <div className="space-y-3">
                {[
                  { date: '2026-09-15', competency: 'Data Analysis', delta: 'Level 1 → Level 2', trigger: 'Passed Competency Assessment #102' },
                  { date: '2026-08-20', competency: 'Cloud Architecture', delta: 'Level 2 → Level 3', trigger: 'Completed Capstone Course' },
                  { date: '2026-07-10', competency: 'Agile Operations', delta: 'Level 1 → Level 2', trigger: 'Verified by Faculty Trainer' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 rounded-container border border-border bg-surface-muted text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-text-primary">{item.competency}</strong>
                        <Badge variant="success">{item.delta}</Badge>
                      </div>
                      <p className="text-text-secondary">{item.trigger}</p>
                    </div>
                    <span className="font-mono text-text-tertiary">{item.date}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: SKILL GAP (Radar Chart - Secondary) */}
          <TabsContent value="skill-gap" className="space-y-4">
            <ChartCard
              title="Role Skill Gap Radar"
              description="Visual representation of your competency footprint vs target role expectations."
              tableData={[
                { label: 'Data Analysis', current: 2, target: 4 },
                { label: 'Cloud Architecture', current: 3, target: 4 },
                { label: 'Agile Operations', current: 2, target: 3 },
                { label: 'Cybersecurity', current: 1, target: 3 },
              ]}
              tableHeaders={['label', 'current', 'target']}
              exportFileName="role-skill-gap-radar"
            >
              <div className="flex justify-center py-4">
                <RadarChart
                  data={[
                    { label: 'Data Analysis', current: 2, target: 4 },
                    { label: 'Cloud Architecture', current: 3, target: 4 },
                    { label: 'Agile Operations', current: 2, target: 3 },
                    { label: 'Cybersecurity', current: 1, target: 3 },
                  ]}
                  size={260}
                />
              </div>
            </ChartCard>
          </TabsContent>

          {/* TAB 4: CERTIFICATES */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earned Certificates</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-xs font-semibold text-text-primary">
                        {cert.id}
                      </TableCell>
                      <TableCell className="font-medium text-text-primary">{cert.courseName}</TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {cert.issueDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActivePage('certificates')}
                        >
                          View Certificate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
