/**
 * Project Kuma - Trainer Profile & Settings View
 * Spec: Expertise, availability (office hours), and trainee profile preview dialog.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLayout } from '../../components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Textarea,
  Select,
  Badge,
  Dialog,
  DialogContent,
} from '../../components/ui';
import { User, Eye, Clock, Sparkles, CheckCircle2, Award, Plus, Trash2 } from 'lucide-react';

export function ProfileSettings() {
  const { profile, updateProfile } = useAuth();
  const { push } = useToast();

  const [firstName, setFirstName] = useState(profile?.firstName || 'Faculty');
  const [surname, setSurname] = useState(profile?.surname || 'Scholar');
  const [department, setDepartment] = useState(profile?.department || 'Computer Science & Engineering');
  const [bio, setBio] = useState(profile?.bio || 'Senior Technical Trainer specializing in cloud architecture and distributed systems.');
  const [expertiseList, setExpertiseList] = useState<string[]>(profile?.subjects || ['Cloud Architecture', 'Kubernetes', 'Python Automation']);
  const [newExpertise, setNewExpertise] = useState('');

  // Availability / Office Hours
  const [availability, setAvailability] = useState('Mon - Fri (10:00 AM - 4:00 PM EST)');
  const [showTraineePreview, setShowTraineePreview] = useState(false);

  const handleAddExpertise = () => {
    if (!newExpertise.trim()) return;
    setExpertiseList([...expertiseList, newExpertise.trim()]);
    setNewExpertise('');
  };

  const handleSave = () => {
    updateProfile({
      firstName,
      surname,
      department,
      bio,
      subjects: expertiseList,
    });
    push({ variant: 'success', title: 'Profile updated', description: 'Trainer profile & expertise updated successfully.' });
  };

  return (
    <PageLayout
      title="Trainer Profile & Settings"
      description="Manage your expert profile, course specializations, availability, and view trainee preview."
      primaryAction={
        <Button variant="secondary" size="sm" onClick={() => setShowTraineePreview(true)}>
          <Eye className="h-4 w-4 mr-1.5" /> Trainee Preview
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 1. IDENTITY & BIO */}
        <Card className="p-6 space-y-4">
          <CardTitle>Personal & Professional Identity</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </FormField>
            <FormField label="Surname / Last Name" required>
              <Input value={surname} onChange={(e) => setSurname(e.target.value)} />
            </FormField>
            <FormField label="Department" className="sm:col-span-2">
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </FormField>
            <FormField label="Bio / Executive Summary" className="sm:col-span-2">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </FormField>
          </div>
        </Card>

        {/* 2. EXPERTISE & SPECIALIZATIONS */}
        <Card className="p-6 space-y-4">
          <CardTitle>Areas of Expertise & Competencies</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={newExpertise}
              onChange={(e) => setNewExpertise(e.target.value)}
              placeholder="Add skill or competency (e.g. Microservices)"
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" onClick={handleAddExpertise}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {expertiseList.map((skill, idx) => (
              <Badge key={idx} variant="info" className="flex items-center gap-1.5 py-1 px-3">
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => setExpertiseList(expertiseList.filter((_, i) => i !== idx))}
                  className="hover:text-danger ml-1"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </Card>

        {/* 3. AVAILABILITY & OFFICE HOURS */}
        <Card className="p-6 space-y-4">
          <CardTitle>Availability & Consultation Hours</CardTitle>
          <FormField label="Weekly Availability Hours">
            <Input value={availability} onChange={(e) => setAvailability(e.target.value)} />
          </FormField>
        </Card>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={handleSave}>
            Save profile changes
          </Button>
        </div>

        {/* HOW TRAINEES SEE IT (PREVIEW DIALOG) */}
        <Dialog open={showTraineePreview} onOpenChange={setShowTraineePreview}>
          <DialogContent className="max-w-xl p-6 space-y-5">
            <div>
              <Badge variant="success" className="mb-2">Public Trainee View</Badge>
              <h3 className="text-xl font-bold text-text-primary">
                {firstName} {surname}
              </h3>
              <p className="text-xs text-text-secondary">{department}</p>
            </div>

            <Card className="p-4 bg-surface-muted border-border space-y-3">
              <p className="text-xs text-text-primary leading-relaxed">{bio}</p>

              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-text-tertiary">Verified Expertise</div>
                <div className="flex flex-wrap gap-1.5">
                  {expertiseList.map((s, i) => (
                    <Badge key={i} variant="info">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-text-secondary pt-2 border-t border-border flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span><strong>Availability:</strong> {availability}</span>
              </div>
            </Card>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowTraineePreview(false)}>
                Close preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
