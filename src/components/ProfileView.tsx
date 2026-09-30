/**
 * Project Kuma - Profile & Settings Workspace View
 * Spec: Sectioned form pages (Personal, Professional, Competencies, Notifications, Appearance)
 * with a sticky save bar showing unsaved changes.
 */

import React, { useState } from 'react';
import { UserSettings, SkillProficiencyLevel, CompetencyCategory } from '../types';
import { PageLayout } from './layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  Input,
  Select,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  InlineAlert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from './ui';
import { User, Briefcase, Award, Bell, Palette, Save, CheckCircle2 } from 'lucide-react';

interface ProfileViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => Promise<void>;
  setActivePage: (page: any) => void;
  theme: 'light' | 'dark';
}

export default function ProfileView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState('personal');

  // Form States
  const [fullName, setFullName] = useState(settings.profile.fullName || 'Trainee Learner');
  const [email, setEmail] = useState(settings.profile.emailAddress || 'trainee@acme.com');
  const [phone, setPhone] = useState(settings.profile.phoneNumber || '+1 555-0199');
  const [department, setDepartment] = useState(settings.profile.department || 'Engineering');
  const [designation, setDesignation] = useState((settings.profile as any).designation || 'Software Engineer');
  const [experience, setExperience] = useState('3 years');

  // Notification Toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [assessmentNotifs, setAssessmentNotifs] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);

  // Appearance
  const [selectedTheme, setSelectedTheme] = useState(theme);

  // Dirty state tracking for sticky save bar
  const isDirty =
    fullName !== (settings.profile.fullName || 'Trainee Learner') ||
    email !== (settings.profile.emailAddress || 'trainee@acme.com') ||
    department !== (settings.profile.department || 'Engineering') ||
    selectedTheme !== theme;

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated: UserSettings = {
        ...settings,
        profile: {
          ...settings.profile,
          fullName,
          emailAddress: email,
          phoneNumber: phone,
          department,
        },
      };
      await onUpdateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFullName(settings.profile.fullName || 'Trainee Learner');
    setEmail(settings.profile.emailAddress || 'trainee@acme.com');
    setPhone(settings.profile.phoneNumber || '+1 555-0199');
    setDepartment(settings.profile.department || 'Engineering');
  };

  return (
    <PageLayout
      title="Profile & Settings"
      description="Manage your account profile, professional information, notifications, and preferences."
    >
      <div className="space-y-6 pb-20">
        {saveSuccess && (
          <InlineAlert variant="success" onClose={() => setSaveSuccess(false)}>
            Settings saved successfully!
          </InlineAlert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-1.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="professional">
              <Briefcase className="h-4 w-4 mr-1.5" /> Professional
            </TabsTrigger>
            <TabsTrigger value="competencies">
              <Award className="h-4 w-4 mr-1.5" /> Competencies
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-1.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-1.5" /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* 1. PERSONAL */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="p-6 space-y-4">
              <CardTitle>Personal Information</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </FormField>
                <FormField label="Email Address" required>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </FormField>
                <FormField label="Phone Number">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </FormField>
              </div>
            </Card>
          </TabsContent>

          {/* 2. PROFESSIONAL */}
          <TabsContent value="professional" className="space-y-4">
            <Card className="p-6 space-y-4">
              <CardTitle>Professional Details</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Department">
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    options={[
                      { value: 'Engineering', label: 'Engineering' },
                      { value: 'Product Management', label: 'Product Management' },
                      { value: 'Data Science', label: 'Data Science' },
                      { value: 'Quality Assurance', label: 'Quality Assurance' },
                    ]}
                  />
                </FormField>
                <FormField label="Target Designation">
                  <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
                </FormField>
                <FormField label="Industry Experience">
                  <Input value={experience} onChange={(e) => setExperience(e.target.value)} />
                </FormField>
              </div>
            </Card>
          </TabsContent>

          {/* 3. COMPETENCIES */}
          <TabsContent value="competencies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verified Competencies</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competency Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(settings.profile.competencies || [
                    { id: '1', name: 'Data Analysis', level: 'Intermediate', category: 'Technical' },
                    { id: '2', name: 'Cloud Architecture', level: 'Advanced', category: 'Engineering' },
                  ]).map((c: any) => (
                    <TableRow key={c.id || c.name}>
                      <TableCell className="font-medium text-text-primary">{c.name}</TableCell>
                      <TableCell className="text-xs text-text-secondary">{c.category || 'Core'}</TableCell>
                      <TableCell><Badge variant="info">{c.level}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 4. NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="p-6 space-y-4">
              <CardTitle>Notification Preferences</CardTitle>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-container border border-border bg-surface-muted">
                  <div>
                    <div className="font-semibold text-text-primary">Email Notifications</div>
                    <div className="text-text-secondary">Receive daily digests and course updates via email</div>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-container border border-border bg-surface-muted">
                  <div>
                    <div className="font-semibold text-text-primary">Assessment Alerts</div>
                    <div className="text-text-secondary">Get notified when new quizzes are assigned</div>
                  </div>
                  <Switch checked={assessmentNotifs} onCheckedChange={setAssessmentNotifs} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-container border border-border bg-surface-muted">
                  <div>
                    <div className="font-semibold text-text-primary">Course Progress Reminders</div>
                    <div className="text-text-secondary">Weekly nudge to keep up with enrolled modules</div>
                  </div>
                  <Switch checked={courseUpdates} onCheckedChange={setCourseUpdates} />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 5. APPEARANCE */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="p-6 space-y-4">
              <CardTitle>Appearance & Theme</CardTitle>
              <div className="flex items-center gap-4">
                <Button
                  variant={selectedTheme === 'light' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedTheme('light')}
                >
                  Light Theme
                </Button>
                <Button
                  variant={selectedTheme === 'dark' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedTheme('dark')}
                >
                  Dark Theme
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* STICKY SAVE BAR SHOWING UNSAVED CHANGES */}
        {isDirty && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-full px-4">
            <div className="flex items-center justify-between p-4 rounded-container border border-border bg-surface shadow-xl text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Save className="h-4 w-4 text-warning" /> You have unsaved changes
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Discard
                </Button>
                <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
