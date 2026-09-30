/**
 * Project Kuma - Trainer My Courses View
 * Spec: Toolbar + Table (title, status, modules, enrolled, completion, last updated, actions menu).
 * Row click opens the course workspace.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { ViewId } from '../types';
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  InlineAlert,
  EmptyState,
} from '../../components/ui';
import { Plus, MoreVertical, BookOpen, Layers } from 'lucide-react';

export function MyCourses({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { courses, coursesLoading, coursesError } = useData();
  const [searchValue, setSearchValue] = useState('');

  const filteredCourses = courses.filter((c) => {
    if (!searchValue.trim()) return true;
    const q = searchValue.toLowerCase();
    return c.courseName.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q);
  });

  return (
    <PageLayout
      title="My Courses & Training Programs"
      description="Manage curriculums, review trainee enrollments, and track course module completion."
      primaryAction={
        <Button variant="primary" size="sm" onClick={() => onNavigate('progress')}>
          <Plus className="h-4 w-4 mr-1.5" /> Create program
        </Button>
      }
    >
      <div className="space-y-6">
        {coursesError && <InlineAlert variant="danger">{coursesError}</InlineAlert>}

        {/* TOOLBAR */}
        <Toolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Filter programs by name or code..."
        />

        {/* TABLE OF COURSES */}
        {coursesLoading ? (
          <Card className="p-8 text-center text-xs text-text-secondary">Loading courses...</Card>
        ) : filteredCourses.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-surface-muted/60"
                    onClick={() => onNavigate('progress')}
                  >
                    <TableCell className="font-medium text-text-primary">
                      <div>
                        <div className="font-semibold">{c.courseName}</div>
                        <div className="text-xs font-mono text-text-tertiary">{c.courseCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={c.isActive !== false ? 'in_progress' : 'not_started'}>
                        {c.isActive !== false ? 'Published' : 'Draft'}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.syllabus?.length || 5} modules</TableCell>
                    <TableCell className="font-mono text-xs">{c.students || 0} trainees</TableCell>
                    <TableCell className="w-40">
                      <ProgressBar value={c.progressPct || c.completionRate || 0} showLabel size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">Recently updated</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Course options">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('progress')}>
                            Open Workspace
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate('my-trainees')}>
                            View Trainees
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-8">
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No courses found"
              description="No training programs match your search query."
              action={
                <Button variant="secondary" onClick={() => setSearchValue('')}>
                  Clear search
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
