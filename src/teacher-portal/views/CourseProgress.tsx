/**
 * Project Kuma - Course Workspace View
 * Spec: Tabs = Overview, Modules, Trainees, Assessments, Settings.
 * Modules tab: ordered list with drag handle / up-down buttons, module type icon, required flag,
 * and an "Add module" Drawer with Azure uploader (progress, cancel, retry).
 * Publish/unpublish uses ConfirmDialog with a checklist of missing items before publish.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PageLayout } from '../../components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
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
  Badge,
  StatusPill,
  ProgressBar,
  Drawer,
  ConfirmDialog,
  InlineAlert,
  Input,
  FormField,
  Select,
} from '../../components/ui';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  FileText,
  Video,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  RotateCcw,
} from 'lucide-react';

interface ModuleItem {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'lab';
  duration: string;
  isRequired: boolean;
}

export function CourseProgress() {
  const { courses } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  // Selected course
  const activeCourse = courses[0] || {
    id: 'course-101',
    courseCode: 'CS-101',
    courseName: 'Cloud Native Architecture & Kubernetes',
    students: 14,
    progressPct: 68,
    isActive: false,
  };

  // Modules List State with Keyboard Reorder
  const [modules, setModules] = useState<ModuleItem[]>([
    { id: 'm1', title: 'Module 1: Introduction to Containerization & Docker', type: 'video', duration: '45 mins', isRequired: true },
    { id: 'm2', title: 'Module 2: Kubernetes Pods & Service Mesh Architecture', type: 'pdf', duration: '60 mins', isRequired: true },
    { id: 'm3', title: 'Module 3: Hands-on Lab: Deploying Microservices Workflows', type: 'lab', duration: '90 mins', isRequired: true },
    { id: 'm4', title: 'Module 4: Security Hardening & Zero-Trust Policies', type: 'pdf', duration: '40 mins', isRequired: false },
  ]);

  // Add Module Drawer state
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleType, setNewModuleType] = useState<'video' | 'pdf' | 'lab'>('video');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Publish / Unpublish ConfirmDialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Checklist before publish
  const missingChecklist = [
    { label: 'Syllabus contains at least 3 required modules', passed: modules.filter((m) => m.isRequired).length >= 3 },
    { label: 'Final competency assessment mapped', passed: true },
    { label: 'Faculty trainer assigned', passed: true },
  ];
  const canPublish = missingChecklist.every((c) => c.passed);

  // Reorder Handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...modules];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setModules(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= modules.length - 1) return;
    const next = [...modules];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setModules(next);
  };

  // Uploader Simulation
  const handleStartUpload = () => {
    if (!newModuleTitle.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Add module to list
          const newMod: ModuleItem = {
            id: `m_${Date.now()}`,
            title: newModuleTitle.trim(),
            type: newModuleType,
            duration: '45 mins',
            isRequired: true,
          };
          setModules((existing) => [...existing, newMod]);
          setNewModuleTitle('');
          setShowAddDrawer(false);
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  return (
    <PageLayout
      title={`${activeCourse.courseName} (${activeCourse.courseCode})`}
      description="Manage curriculum modules, track trainee performance, and configure evaluation settings."
      primaryAction={
        <Button
          variant={isPublished ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setShowPublishDialog(true)}
        >
          {isPublished ? 'Unpublish course' : 'Publish course'}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* TABS HEADER */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
            <TabsTrigger value="trainees">Trainees ({activeCourse.students})</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 space-y-1">
                <div className="text-xs text-text-secondary">Enrolled Trainees</div>
                <div className="text-xl font-bold text-text-primary">{activeCourse.students}</div>
              </Card>
              <Card className="p-4 space-y-1">
                <div className="text-xs text-text-secondary">Avg Progress</div>
                <div className="text-xl font-bold text-text-primary">{activeCourse.progressPct}%</div>
              </Card>
              <Card className="p-4 space-y-1">
                <div className="text-xs text-text-secondary">Publish Status</div>
                <div><StatusPill status={isPublished ? 'completed' : 'not_started'}>{isPublished ? 'Published' : 'Draft'}</StatusPill></div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: MODULES (Ordered list + Keyboard Reorder + Add Module Drawer) */}
          <TabsContent value="modules" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Curriculum Modules</h3>
              <Button variant="primary" size="sm" onClick={() => setShowAddDrawer(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add module
              </Button>
            </div>

            <Card className="p-4 space-y-3">
              {modules.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3.5 rounded-container border border-border bg-surface hover:bg-surface-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Drag & Keyboard Reorder Handles */}
                    <div className="flex items-center gap-1 text-text-tertiary">
                      <GripVertical className="h-4 w-4 cursor-grab" aria-label="Drag handle" />
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          aria-label="Move module up"
                          className="h-5 w-5 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          disabled={idx === modules.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          aria-label="Move module down"
                          className="h-5 w-5 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Type icon */}
                    <div className="p-2 rounded-control bg-surface-muted border border-border">
                      {m.type === 'video' ? (
                        <Video className="h-4 w-4 text-info" aria-label="Video module" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" aria-label="Document module" />
                      )}
                    </div>

                    {/* Title & Metadata */}
                    <div>
                      <div className="font-semibold text-text-primary text-xs flex items-center gap-2">
                        <span>{m.title}</span>
                        {m.isRequired && <Badge variant="warning">Required</Badge>}
                      </div>
                      <span className="text-[11px] text-text-tertiary font-mono">{m.duration}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModules((prev) => prev.filter((item) => item.id !== m.id))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </Card>
          </TabsContent>

          {/* TAB 3: TRAINEES */}
          <TabsContent value="trainees" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-text-primary mb-3">Enrolled Trainee Progress</h3>
              <p className="text-xs text-text-secondary">Switch to the Trainees tab in main navigation for individual activity details.</p>
            </Card>
          </TabsContent>

          {/* TAB 4: ASSESSMENTS */}
          <TabsContent value="assessments" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-text-primary mb-3">Mapped Competency Assessments</h3>
              <p className="text-xs text-text-secondary">Competency evaluation mapped: Cloud Architecture Level 2 Assessment.</p>
            </Card>
          </TabsContent>

          {/* TAB 5: SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-text-primary mb-3">Course Settings</h3>
              <p className="text-xs text-text-secondary">Configure course code, access rules, and pass thresholds.</p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ADD MODULE DRAWER (AZURE UPLOADER INTEGRATED) */}
        <Drawer open={showAddDrawer} onOpenChange={setShowAddDrawer} side="right" className="w-full max-w-md p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Add Curriculum Module</h3>
            <p className="text-xs text-text-secondary">Upload content files to Azure Storage and register new module.</p>
          </div>

          <div className="space-y-4">
            <FormField label="Module Title" required>
              <Input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="e.g. Module 5: Advanced Security Patterns" />
            </FormField>

            <FormField label="Module Content Type">
              <Select
                value={newModuleType}
                onChange={(e) => setNewModuleType(e.target.value as any)}
                options={[
                  { value: 'video', label: 'Video Lecture (.mp4)' },
                  { value: 'pdf', label: 'PDF Document (.pdf)' },
                  { value: 'lab', label: 'Interactive Hands-on Lab' },
                ]}
              />
            </FormField>

            {/* Azure File Uploader Dropzone */}
            <div className="border-2 border-dashed border-border p-6 rounded-container text-center space-y-2 bg-surface-muted/50">
              <Upload className="h-6 w-6 text-primary mx-auto" />
              <div className="text-xs font-semibold text-text-primary">Select media or document file</div>
              <div className="text-[11px] text-text-tertiary">Azure Blob Storage upload ready</div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Uploading to Azure storage...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} size="sm" />
              </div>
            )}

            {uploadError && <InlineAlert variant="danger">{uploadError}</InlineAlert>}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowAddDrawer(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isUploading} onClick={handleStartUpload}>
                Upload & Add
              </Button>
            </div>
          </div>
        </Drawer>

        {/* PUBLISH / UNPUBLISH CONFIRMDALOG WITH CHECKLIST */}
        <ConfirmDialog
          open={showPublishDialog}
          onOpenChange={setShowPublishDialog}
          title={isPublished ? 'Unpublish Course?' : 'Publish Course to Organization?'}
          description={
            <div className="space-y-3 text-xs text-text-secondary text-left mt-2">
              <p>Review the pre-publish requirements checklist:</p>
              <div className="space-y-2">
                {missingChecklist.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${c.passed ? 'text-success' : 'text-danger'}`} />
                    <span className={c.passed ? 'text-text-primary' : 'text-danger font-medium'}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          }
          confirmText={isPublished ? 'Unpublish' : 'Publish course'}
          cancelText="Cancel"
          onConfirm={() => {
            if (!isPublished && !canPublish) return;
            setIsPublished(!isPublished);
            setShowPublishDialog(false);
          }}
        />
      </div>
    </PageLayout>
  );
}
