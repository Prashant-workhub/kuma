/**
 * Project Kuma - Training Program Lifecycle & Assessment Engine Modal
 * Manages full training flow: Enrollment ➔ Learning Content Progress ➔ Assessment Eligibility ➔ Completion ➔ Certificate
 */

import React, { useState, useEffect } from 'react';
import { TeacherAssignment, UserSettings, TrainingEnrollment, TrainingCertificate, Quiz } from '../types';
import { enrollInCourse, updateEnrollmentProgress, getEnrollmentByCourse } from '../utils/enrollmentUtils';
import { getCertificateById, getAllCertificates } from '../utils/certificateUtils';
import { INITIAL_QUIZZES } from '../data';
import { Modal, Button, Badge } from './bauhaus';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award, 
  Layers, 
  PlayCircle, 
  Check, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface TrainingLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: TeacherAssignment | null;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onTakeAssessment: (quiz: Quiz) => void;
  onViewCertificate: (cert: TrainingCertificate) => void;
}

export default function TrainingLifecycleModal({
  isOpen,
  onClose,
  course,
  settings,
  onUpdateSettings,
  onTakeAssessment,
  onViewCertificate
}: TrainingLifecycleModalProps) {
  const [syllabusItems, setSyllabusItems] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [enrollment, setEnrollment] = useState<TrainingEnrollment | null>(null);
  const [certificate, setCertificate] = useState<TrainingCertificate | null>(null);

  const userId = settings.profile.uid || 'user-demo-1';

  useEffect(() => {
    if (!course) return;

    // Load initial syllabus
    const initialSyllabus = course.syllabus || [
      { id: 's1', title: 'Fundamentals & Foundational Concepts', done: false },
      { id: 's2', title: 'Core Principles & Practical Application', done: false },
      { id: 's3', title: 'Advanced Implementation & Best Practices', done: false },
      { id: 's4', title: 'Case Study & Operational Exercises', done: false }
    ];
    setSyllabusItems(initialSyllabus);

    // Load existing enrollment
    const existingEnr = getEnrollmentByCourse(userId, course.id);
    setEnrollment(existingEnr);

    if (existingEnr && existingEnr.certificateId) {
      const cert = getCertificateById(existingEnr.certificateId);
      setCertificate(cert);
    } else {
      setCertificate(null);
    }
  }, [course, userId, isOpen]);

  if (!isOpen || !course) return null;

  const totalTopics = syllabusItems.length;
  const completedTopics = syllabusItems.filter(s => s.done).length;
  const learningProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const isLearningContentComplete = learningProgress === 100;

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  const handleEnroll = () => {
    const newEnr = enrollInCourse(userId, settings.profile, course);
    setEnrollment(newEnr);
  };

  const handleToggleTopic = (topicId: string) => {
    if (!isEnrolled) {
      // Auto-enroll when user starts interacting with syllabus
      handleEnroll();
    }

    const updatedSyllabus = syllabusItems.map(item => {
      if (item.id !== topicId) return item;
      return { ...item, done: !item.done };
    });

    setSyllabusItems(updatedSyllabus);

    const newDone = updatedSyllabus.filter(s => s.done).length;
    const newProgress = Math.round((newDone / totalTopics) * 100);

    // Update enrollment progress
    const res = updateEnrollmentProgress(
      userId,
      settings.profile,
      course,
      newProgress,
      enrollment?.quizPassed || false
    );

    setEnrollment(res.enrollment);
    if (res.certificate) {
      setCertificate(res.certificate);
    }
  };

  // Find associated quiz for course
  const associatedQuiz: Quiz = INITIAL_QUIZZES.find(
    q => (q.courseCode && q.courseCode === course.courseCode) ||
         (course.competencyNames && course.competencyNames.some(cn => q.competencyName?.toLowerCase() === cn.toLowerCase()))
  ) || {
    id: `quiz-${course.id}`,
    title: `${course.courseName} Final Evaluation`,
    topic: course.subject || 'Capacity Building Assessment',
    courseCode: course.courseCode,
    courseName: course.courseName,
    questionsCount: 4,
    estimatedTime: '15 mins',
    passingScore: 60,
    competencyId: course.competencyIds?.[0] || 'cat-comp-1',
    competencyName: course.competencyNames?.[0] || 'Target Competency',
    status: isCompleted ? 'completed' : 'available',
    questions: [
      {
        id: 'q1',
        question: `What is a primary principle taught in ${course.courseName}?`,
        options: ['Structured methodology and standardized processes', 'Ad-hoc manual execution', 'Ignoring quality constraints', 'Bypassing compliance protocols'],
        correctAnswerIndex: 0,
        explanation: 'Standardized structured methodology is essential for capacity building.'
      },
      {
        id: 'q2',
        question: 'Which approach ensures effective competency level progression?',
        options: ['Continuous assessment and skill gap identification', 'One-time onboarding without evaluation', 'Avoiding assessments', 'Random assignment'],
        correctAnswerIndex: 0,
        explanation: 'Continuous assessment against organizational benchmarks drives competency growth.'
      },
      {
        id: 'q3',
        question: 'How are skill gaps calculated accurately?',
        options: ['Subtracting current assessed level from required role target level', 'Random estimation', 'Self-declared score only', 'Highest score in class'],
        correctAnswerIndex: 0,
        explanation: 'Skill gap = Max(Required Target Level - Current Level, 0).'
      },
      {
        id: 'q4',
        question: 'What is required to earn an official digital capacity certificate?',
        options: ['Completing required training content + Passing final assessment', 'Enrolling in course only', 'Failing assessment', 'Self-declaring completion'],
        correctAnswerIndex: 0,
        explanation: 'Training completion and passed assessment are both mandatory.'
      }
    ]
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`TRAINING PROGRAM: ${course.courseCode} - ${course.courseName.toUpperCase()}`}
      size="lg"
    >
      <div className="space-y-6 select-none p-1 font-mono">
        
        {/* Course Header Banner */}
        <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-5 space-y-3 shadow-paper-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded bg-[#9C27B0]/20 text-[#9C27B0] border border-[#9C27B0]/40">
                  {course.courseCode}
                </span>
                {course.duration && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)]">
                    <Clock className="h-3.5 w-3.5" />
                    {course.duration}
                  </span>
                )}
              </div>
              <h2 className="font-heading font-black text-lg text-[var(--text-primary)] uppercase mt-1">
                {course.courseName}
              </h2>
            </div>

            {/* Status Lifecycle Badge */}
            <div className="self-start sm:self-center shrink-0">
              {!isEnrolled ? (
                <span className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-800 text-[var(--text-secondary)] text-xs font-black uppercase border border-[var(--border-main)]">
                  LIFECYCLE: NOT ENROLLED
                </span>
              ) : isCompleted ? (
                <span className="px-3 py-1 rounded bg-[#19B56B]/20 text-[#19B56B] text-xs font-black uppercase border border-[#19B56B]/40">
                  LIFECYCLE: COMPLETED & CERTIFIED
                </span>
              ) : isLearningContentComplete ? (
                <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-black uppercase border border-purple-500/40">
                  LIFECYCLE: ASSESSMENT PENDING
                </span>
              ) : (
                <span className="px-3 py-1 rounded bg-[#FFC400]/20 text-[#B78103] dark:text-[#FFD54F] text-xs font-black uppercase border border-[#FFC400]/40">
                  LIFECYCLE: IN PROGRESS ({learningProgress}%)
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {course.description || 'Organizational capacity building training program.'}
          </p>

          {/* Mapped Competencies */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-bold text-[var(--text-secondary)] uppercase">Target Competencies:</span>
            {course.competencyNames?.map((cName, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30">
                {cName}
              </span>
            ))}
          </div>
        </div>

        {/* NOT ENROLLED CALLOUT BANNER */}
        {!isEnrolled && (
          <div className="p-4 rounded-[6px] border-2 border-blue-500/40 bg-blue-500/10 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase">
                ENROLLMENT REQUIRED
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Enroll in this training program to start tracking learning progress and unlock the competency assessment.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEnroll}
              className="bg-[#9C27B0] hover:bg-[#8E24AA] text-white shrink-0"
            >
              Enroll Now
            </Button>
          </div>
        )}

        {/* SYLLABUS & LEARNING CONTENT PROGRESS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-extrabold text-xs uppercase text-[var(--text-primary)] tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#FFC400]" />
              REQUIRED TRAINING CONTENT & SYLLABUS
            </h4>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {completedTopics}/{totalTopics} Modules Done ({learningProgress}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden border border-[var(--border-main)]">
            <div
              className={`h-full transition-all duration-300 ${isLearningContentComplete ? 'bg-[#19B56B]' : 'bg-[#FFC400]'}`}
              style={{ width: `${learningProgress}%` }}
            />
          </div>

          {/* Syllabus Items Checkbox List */}
          <div className="space-y-2 pt-1">
            {syllabusItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleToggleTopic(item.id)}
                className={`p-3 rounded-[6px] border-2 transition-all flex items-center justify-between cursor-pointer ${
                  item.done
                    ? 'border-[#19B56B]/40 bg-[#19B56B]/10 text-[var(--text-primary)]'
                    : 'border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--panel-bg)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center font-bold text-xs ${
                    item.done ? 'bg-[#19B56B] border-[#19B56B] text-white' : 'border-[var(--border-main)] bg-[var(--bg-main)]'
                  }`}>
                    {item.done && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-xs font-bold ${item.done ? 'line-through text-[var(--text-primary)]' : ''}`}>
                    Module {idx + 1}: {item.title}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                  {item.done ? 'COMPLETED' : 'CLICK TO COMPLETE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ASSESSMENT ELIGIBILITY & TAKING SECTION */}
        <div className="pt-3 border-t-2 border-[var(--border-main)] space-y-3">
          <h4 className="font-heading font-extrabold text-xs uppercase text-[var(--text-primary)] tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            FINAL COMPETENCY ASSESSMENT
          </h4>

          {/* CASE 1: LEARNING CONTENT NOT COMPLETED */}
          {!isLearningContentComplete && (
            <div className="p-4 rounded-[6px] border-2 border-amber-500/40 bg-amber-500/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Assessment Locked: Complete all syllabus modules first.</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                “Complete the required training before attempting the assessment.” You must achieve 100% learning progress to unlock the evaluation.
              </p>
              <Button variant="tertiary" size="sm" disabled className="opacity-50 cursor-not-allowed">
                Assessment Locked
              </Button>
            </div>
          )}

          {/* CASE 2: LEARNING CONTENT COMPLETE -> ASSESSMENT AVAILABLE */}
          {isLearningContentComplete && !isCompleted && (
            <div className="p-4 rounded-[6px] border-2 border-purple-500/40 bg-purple-500/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                <Award className="h-4 w-4 shrink-0 text-purple-500" />
                <span>Training Content 100% Complete! Final Assessment Unlocked.</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                You meet all prerequisites. Pass the final assessment (Score ≥ 60%) to update your assessed competency level and earn an official digital certificate.
              </p>

              {enrollment?.quizPassed === false && (
                <div className="p-2.5 rounded bg-red-500/15 border border-red-500/30 text-xs text-red-500 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Previous attempt was below 60%. You may retake the assessment.</span>
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onTakeAssessment(associatedQuiz);
                }}
                className="bg-[#9C27B0] hover:bg-[#8E24AA] text-white flex items-center gap-1.5"
              >
                <PlayCircle className="h-4 w-4" />
                <span>{enrollment?.quizPassed === false ? 'Retake Final Assessment' : 'Take Final Assessment'}</span>
              </Button>
            </div>
          )}

          {/* CASE 3: COMPLETED & CERTIFIED */}
          {isCompleted && (
            <div className="p-4 rounded-[6px] border-2 border-[#19B56B]/40 bg-[#19B56B]/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#19B56B]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#19B56B]" />
                <span>Training Program Completed & Assessment Passed!</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Your assessed competency level has been updated and an official digital certificate has been issued.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (certificate) {
                      onClose();
                      onViewCertificate(certificate);
                    }
                  }}
                  className="bg-[#19B56B] hover:bg-[#159A5A] text-white flex items-center gap-1.5"
                >
                  <Award className="h-4 w-4" />
                  <span>View Official Certificate</span>
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>
    </Modal>
  );
}
