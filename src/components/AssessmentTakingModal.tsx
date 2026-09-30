/**
 * Project Kuma - Graded Assessment Component
 * Spec: FocusLayout, question navigator, timer in top bar with aria-live warnings at 5 min and 1 min,
 * ConfirmDialog before submit, results screen: score, pass/fail, "Competency change" table (Competency / Before / After),
 * review with explanations, and next-step actions.
 */

import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttemptRecord, CatalogCompetency } from '../types';
import { CheckCircle2, XCircle, Award, ArrowRight, RotateCcw, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import { startAssessment, submitAssessment, SubmitAssessmentResponse } from '../services/assessmentService';
import { FocusLayout } from './layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  StatusPill,
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  InlineAlert,
  ProgressBar,
} from './ui';

interface AssessmentTakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  catalog: CatalogCompetency[];
  userId: string;
  userName: string;
  onCompleteAttempt: (attempt: QuizAttemptRecord) => Promise<void> | void;
}

export default function AssessmentTakingModal({
  isOpen,
  onClose,
  quiz,
  catalog,
  userId,
  userName,
  onCompleteAttempt,
}: AssessmentTakingModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: number }>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitAssessmentResponse | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttemptRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [sanitizedQuestions, setSanitizedQuestions] = useState<Array<{ id: string; type?: string; question: string; options: string[] }>>([]);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [timerAlert, setTimerAlert] = useState<string | null>(null);

  // Handle session start when modal opens
  useEffect(() => {
    if (!isOpen || !quiz) {
      handleResetState();
      return;
    }

    let isMounted = true;
    async function initAssessment() {
      setIsStarting(true);
      setStartError(null);
      handleResetState();

      try {
        const startRes = await startAssessment(quiz!.id);
        if (!isMounted) return;

        setAttemptId(startRes.attemptId);
        setSanitizedQuestions(startRes.assessment.questions);

        const timeLimitMin = startRes.assessment.timeLimitMinutes || 15;
        const totalSec = timeLimitMin * 60;
        const elapsedSec = Math.floor((Date.now() - new Date(startRes.startedAt).getTime()) / 1000);
        const remaining = Math.max(0, totalSec - elapsedSec);
        setTimeRemainingSeconds(remaining);
      } catch (err) {
        if (!isMounted) return;
        setAttemptId(`att_${Date.now()}`);
        setSanitizedQuestions(quiz!.questions.map((q) => ({
          id: q.id,
          type: q.type || 'mcq',
          question: q.question,
          options: q.options,
        })));
        const timeLimitMin = Number((quiz!.estimatedTime || '15').replace(/\D/g, '')) || 15;
        setTimeRemainingSeconds(timeLimitMin * 60);
      } finally {
        if (isMounted) setIsStarting(false);
      }
    }

    initAssessment();
    return () => {
      isMounted = false;
    };
  }, [isOpen, quiz?.id]);

  // Countdown timer & aria-live warnings
  useEffect(() => {
    if (timeRemainingSeconds === null || isSubmitted || !isOpen || startError) return;

    if (timeRemainingSeconds === 300) {
      setTimerAlert('Warning: 5 minutes remaining in assessment.');
    } else if (timeRemainingSeconds === 60) {
      setTimerAlert('Critical warning: 1 minute remaining in assessment!');
    }

    if (timeRemainingSeconds <= 0) {
      if (!isSubmitting && attemptId) {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemainingSeconds, isSubmitted, isOpen, startError, attemptId]);

  function handleResetState() {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setAttemptId(null);
    setIsSubmitted(false);
    setSubmitResult(null);
    setLatestAttempt(null);
    setSubmitError(null);
    setTimeRemainingSeconds(null);
    setShowConfirmSubmit(false);
    setTimerAlert(null);
  }

  if (!isOpen || !quiz) return null;

  const questionsList = sanitizedQuestions.length > 0 ? sanitizedQuestions : quiz.questions;
  const totalQuestions = questionsList.length;
  const currentQuestion = questionsList[currentQuestionIndex];
  const competencyName = quiz.competencyName || catalog.find((c) => c.id === quiz.competencyId)?.name || 'General Competency';
  const passingScore = quiz.passingScore || 60;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted || !currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      setSubmitError('Your profile is unavailable. Sign in again before submitting.');
      return;
    }
    if (!attemptId) {
      setSubmitError('Session not properly initialized. Close and re-open assessment.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const res = await submitAssessment(quiz.id, attemptId, userAnswers);
      setSubmitResult(res);

      const attemptRecord: QuizAttemptRecord = {
        id: res.attemptId,
        userId,
        trainerId: quiz.trainerId,
        assignmentId: quiz.assignmentId,
        trainingProgramId: quiz.trainingProgramId,
        userName: userName || 'Trainee Learner',
        quizId: quiz.id,
        quizTitle: quiz.title,
        subject: quiz.courseName || quiz.courseCode || 'Training Program',
        topic: quiz.topic,
        competencyId: quiz.competencyId || 'cat-comp-2',
        competencyName,
        score: res.score,
        totalQuestions: res.totalQuestions,
        scorePercentage: res.scorePercentage,
        accuracy: res.scorePercentage,
        passed: res.passed,
        assessedLevel: res.level,
        assessedNumericLevel: res.numericLevel,
        completedAt: res.completedAt,
      };

      await onCompleteAttempt(attemptRecord);
      setLatestAttempt(attemptRecord);
      setIsSubmitted(true);
    } catch (error) {
      console.error('[Assessment] Submission failed:', error);
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(userAnswers).length;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPct = isSubmitted ? 100 : Math.round(((currentQuestionIndex + 1) / Math.max(totalQuestions, 1)) * 100);

  return (
    <FocusLayout
      title={quiz.title}
      subtitle={`Competency: ${competencyName}`}
      progress={progressPct}
      onExit={onClose}
    >
      <div className="space-y-6 select-none">
        {/* ARIA-LIVE TIMER WARNING ANNOUNCER */}
        {timerAlert && (
          <div aria-live="assertive" className="sr-only">
            {timerAlert}
          </div>
        )}

        {/* Top bar details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-container border border-border bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">Competency Evaluation</Badge>
              <span className="text-xs text-text-secondary">Pass Score: {passingScore}%</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mt-1">
              Target: <span className="text-primary">{competencyName}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {timeRemainingSeconds !== null && !isSubmitted && (
              <div
                aria-live="polite"
                className={`flex items-center gap-1.5 font-mono font-semibold text-sm ${
                  timeRemainingSeconds < 120 ? 'text-danger animate-pulse' : 'text-text-primary'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Timer: {formatTimer(timeRemainingSeconds)}</span>
              </div>
            )}
          </div>
        </div>

        {startError && (
          <InlineAlert variant="danger" title="Assessment Blocked">
            {startError}
          </InlineAlert>
        )}

        {/* ACTIVE QUESTION VIEW */}
        {!isStarting && !startError && !isSubmitted && currentQuestion && (
          <div className="space-y-5">
            {submitError && <InlineAlert variant="danger">{submitError}</InlineAlert>}

            {/* QUESTION NAVIGATOR ROW */}
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {questionsList.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-8 w-8 rounded-control text-xs font-medium transition-colors shrink-0 flex items-center justify-center ${
                      isCurrent
                        ? 'bg-primary text-white font-bold'
                        : isAnswered
                        ? 'bg-success/20 text-success border border-success/40'
                        : 'bg-surface-muted text-text-secondary border border-border'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-text-primary leading-relaxed">
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </h3>

              <div className="space-y-2">
                {currentQuestion.options.map((optText, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-left p-4 rounded-container border text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10 font-semibold text-text-primary'
                          : 'border-border bg-surface hover:bg-surface-muted text-text-secondary'
                      }`}
                    >
                      <span>{optText}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Nav & Submit Bar */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button variant="primary" onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
                    Next question
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setShowConfirmSubmit(true)}>
                    Submit assessment
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {isSubmitted && submitResult && (
          <div className="space-y-6">
            <Card className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <StatusPill status={submitResult.passed ? 'completed' : 'failed'}>
                  {submitResult.passed ? 'Passed Evaluation' : 'Needs Review'}
                </StatusPill>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  {submitResult.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  You scored <strong className="text-text-primary">{submitResult.scorePercentage}%</strong> ({submitResult.score} of {submitResult.totalQuestions} questions correct). Required: {passingScore}%.
                </p>
              </div>
            </Card>

            {/* COMPETENCY CHANGE TABLE */}
            <Card className="p-5 space-y-3">
              <h3 className="text-base font-semibold text-text-primary">Competency Change</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competency</TableHead>
                    <TableHead>Before</TableHead>
                    <TableHead>After</TableHead>
                    <TableHead>Assessed Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-text-primary">{competencyName}</TableCell>
                    <TableCell><Badge variant="neutral">Level 1</Badge></TableCell>
                    <TableCell>
                      <Badge variant={submitResult.passed ? 'success' : 'warning'}>
                        {submitResult.level || 'Level 2'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{submitResult.numericLevel || '2.0'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            {/* REVIEW WITH EXPLANATIONS */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-text-primary">Question Review</h3>
              {Object.entries(submitResult.perQuestion || {}).map(([qId, item], idx) => (
                <Card key={qId || idx} className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Question {idx + 1}</span>
                    <Badge variant={item.isCorrect ? 'success' : 'danger'}>
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>
                  <InlineAlert variant={item.isCorrect ? 'success' : 'danger'} title="Explanation">
                    {item.explanation || 'Reviewed against curriculum competencies.'}
                  </InlineAlert>
                </Card>
              ))}
            </div>

            {/* NEXT STEP ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" onClick={onClose}>
                Back to Home
              </Button>
              <Button variant="primary" onClick={onClose}>
                View Growth
              </Button>
            </div>
          </div>
        )}

        {/* CONFIRM DIALOG BEFORE SUBMIT */}
        <ConfirmDialog
          open={showConfirmSubmit}
          onOpenChange={setShowConfirmSubmit}
          title="Submit Assessment?"
          description={`You have answered ${answeredCount} of ${totalQuestions} questions. Are you ready to submit for final evaluation?`}
          confirmText="Yes, submit assessment"
          cancelText="Keep working"
          isLoading={isSubmitting}
          onConfirm={handleSubmit}
        />
      </div>
    </FocusLayout>
  );
}
