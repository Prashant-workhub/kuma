/**
 * Project Kuma - Trainer Announcements View
 * Spec: Announcement composer in a Dialog. List of posted broadcasts.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLayout } from '../../components/layout';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  FormField,
  Input,
  Textarea,
  Badge,
  EmptyState,
  InlineAlert,
} from '../../components/ui';
import { Megaphone, Plus, Radio, Pin, Send } from 'lucide-react';

export function Announcements() {
  const { announcements, courses, addAnnouncement } = useData();
  const { profile } = useAuth();
  const { push } = useToast();

  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<string[]>([]);

  const author = profile ? `${profile.firstName} ${profile.surname}` : 'Faculty Trainer';
  const reach = courses.filter((c) => audience.includes(c.courseCode)).reduce((s, c) => s + c.students, 0);

  const toggleAudience = (code: string) => {
    setAudience((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleBroadcast = () => {
    if (!title.trim() || !body.trim() || audience.length === 0) {
      push({ variant: 'warning', title: 'Incomplete announcement', description: 'Fill out title, message, and audience.' });
      return;
    }

    addAnnouncement({ title: title.trim(), body: body.trim(), audience, author });
    push({ variant: 'success', title: 'Announcement broadcasted', description: `Reached ${reach} trainees.` });
    setTitle('');
    setBody('');
    setAudience([]);
    setShowComposer(false);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return Date.parse(b.postedAt) - Date.parse(a.postedAt);
  });

  return (
    <PageLayout
      title="Announcements & Broadcasts"
      description="Post updates to your classes and send push notifications to enrolled trainees."
      primaryAction={
        <Button variant="primary" size="sm" onClick={() => setShowComposer(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New broadcast
        </Button>
      }
    >
      <div className="space-y-6">
        {/* LIST OF ANNOUNCEMENTS */}
        {sortedAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {sortedAnnouncements.map((a) => (
              <Card key={a.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="h-4 w-4 text-warning" aria-label="Pinned broadcast" />}
                    <h3 className="font-semibold text-text-primary text-base">{a.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-text-tertiary">
                    {new Date(a.postedAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{a.body}</p>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-text-tertiary">Audience:</span>
                    {a.audience.map((code) => (
                      <Badge key={code} variant="info">{code}</Badge>
                    ))}
                  </div>
                  <span className="text-text-tertiary">Author: {a.author}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <EmptyState
              icon={<Megaphone className="h-8 w-8" />}
              title="No broadcasts yet"
              description="Post announcements to update trainees across your courses."
              action={
                <Button variant="primary" onClick={() => setShowComposer(true)}>
                  Create announcement
                </Button>
              }
            />
          </Card>
        )}

        {/* ANNOUNCEMENT COMPOSER DIALOG */}
        <Dialog open={showComposer} onOpenChange={setShowComposer}>
          <DialogContent className="max-w-xl p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">New Broadcast Announcement</h3>
              <p className="text-xs text-text-secondary">Compose a message for your enrolled course cohorts.</p>
            </div>

            <div className="space-y-4">
              <FormField label="Title" required>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule update for Module 3"
                />
              </FormField>

              <FormField label="Message Details" required>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Write the announcement details..."
                />
              </FormField>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary block">Audience Courses</label>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c) => {
                    const selected = audience.includes(c.courseCode);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleAudience(c.courseCode)}
                        className={`px-3 py-1 rounded-control text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface-muted text-text-secondary border-border'
                        }`}
                      >
                        {c.courseCode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button variant="secondary" onClick={() => setShowComposer(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleBroadcast}>
                  <Send className="h-4 w-4 mr-1.5" /> Broadcast now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
