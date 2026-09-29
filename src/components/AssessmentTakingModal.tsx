/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quiz, QuizAttemptRecord, CatalogCompetency, SkillProficiencyLevel } from '../types';
import { calculateAssessedProficiency } from '../utils/competencyUtils';
import { Modal, Button, Badge } from './bauhaus';
import { CheckCircle2, XCircle, Award, Target, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';

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
  onCompleteAttempt
}: AssessmentTakingModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttemptRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen || !quiz) return null;

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const competencyName = quiz.competencyName || catalog.find(c => c.id === quiz.competencyId)?.name || 'General Competency';
  const passingScore = quiz.passingScore || 60;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      setSubmitError('Your Firebase profile is unavailable. Sign in again before submitting.');
      return;
    }
    setSubmitError(null);
    let correctCount = 0;
    quiz.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
    const passed = percentage >= passingScore;
    const { level: assessedLevel, numericLevel: assessedNumericLevel } = calculateAssessedProficiency(percentage);

    const attemptRecord: QuizAttemptRecord = {
      id: `attempt-${Date.now()}`,
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
      score: correctCount,
      totalQuestions,
      scorePercentage: percentage,
      accuracy: percentage,
      passed,
      assessedLevel,
      assessedNumericLevel,
      completedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
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

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setLatestAttempt(null);
    setSubmitError(null);
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ASSESSMENT: ${quiz.title.toUpperCase()}`}
      size="lg"
    >
      <div className="space-y-6 select-none p-1">

        {/* Header Metadata Banner */}
        <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-paper-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[var(--border-main)] bg-[#FFC400] text-[#111111]">
                COMPETENCY ASSESSMENT
              </span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold">
                Passing Score: {passingScore}%
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-base text-[var(--text-primary)] mt-1">
              Target Competency: <span className="text-[#9C27B0] dark:text-[#E040FB]">{competencyName}</span>
            </h3>
          </div>
          <div className="text-right font-mono text-xs text-[var(--text-secondary)]">
            <div>Questions: {totalQuestions}</div>
            <div>Time Est: {quiz.estimatedTime || '15 mins'}</div>
          </div>
        </div>

        {/* NOT SUBMITTED: QUESTION VIEW */}
        {!isSubmitted && (
          <div className="space-y-6">
            {submitError && (
              <div role="alert" className="rounded-md border-2 border-red-500 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-300">
                {submitError}
              </div>
            )}

            {/* Question Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold text-[var(--text-secondary)]">
                <span>QUESTION {currentQuestionIndex + 1} OF {totalQuestions}</span>
                <span>{answeredCount}/{totalQuestions} Answered</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden border border-[var(--border-main)]">
                <div
                  className="h-full bg-[#FFC400] transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Box */}
            <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-5 space-y-4 shadow-paper-sm">
              <h4 className="font-heading font-bold text-base text-[var(--text-primary)] leading-snug">
                {currentQuestion.question}
              </h4>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = userAnswers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-[6px] border-2 transition-all font-mono text-xs font-bold flex items-center justify-between cursor-pointer ${isSelected
                          ? 'border-[var(--border-main)] bg-[#FFC400] text-[#111111] shadow-paper-xs font-extrabold'
                          : 'border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[11px] font-black shrink-0 ${isSelected ? 'border-[#111111] bg-white text-[#111111]' : 'border-[var(--border-main)] bg-[var(--card-bg)]'
                          }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-[#111111] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="tertiary"
                size="sm"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNext}
                  className="bg-[#FFC400]"
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={answeredCount < totalQuestions || isSubmitting}
                  icon={<ArrowRight className="h-4 w-4" />}
                  className="bg-[#19B56B] text-white border-2 border-[#111111]"
                >
                  {isSubmitting ? 'Saving assessment…' : 'Submit Assessment'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* SUBMITTED: RESULT VIEW */}
        {isSubmitted && latestAttempt && (
          <div className="space-y-6 animate-fade-in">

            {/* Result Header Card */}
            <div className={`p-6 rounded-[6px] border-2 border-[var(--border-main)] text-center space-y-3 shadow-paper-md ${latestAttempt.passed ? 'bg-[#19B56B]/15 border-[#19B56B]' : 'bg-red-500/15 border-red-500'
              }`}>
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-white dark:bg-neutral-900 border-2 border-[var(--border-main)] shadow-paper-xs">
                {latestAttempt.passed ? (
                  <Award className="h-8 w-8 text-[#19B56B]" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">
                  ASSESSMENT COMPLETED
                </span>
                <h3 className="font-heading font-black text-2xl text-[var(--text-primary)] uppercase mt-0.5">
                  {latestAttempt.passed ? 'ASSESSMENT PASSED' : 'ASSESSMENT NOT PASSED'}
                </h3>
              </div>

              {/* Score & Assessed Level Display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto">
                <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)]">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">Score</div>
                  <div className="font-heading font-black text-xl text-[var(--text-primary)] mt-0.5">
                    {latestAttempt.scorePercentage}%
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {latestAttempt.score} / {latestAttempt.totalQuestions} Correct
                  </div>
                </div>

                <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)]">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">Assessed Competency</div>
                  <div className="font-heading font-bold text-xs text-[var(--text-primary)] truncate mt-1" title={latestAttempt.competencyName}>
                    {latestAttempt.competencyName}
                  </div>
                  <div className="text-[10px] font-mono text-[#9C27B0] font-bold mt-0.5">Catalog Mapped</div>
                </div>

                <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)]">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">Assessed Level</div>
                  <div className="font-heading font-black text-lg text-[#19B56B] dark:text-[#00E676] mt-0.5 uppercase">
                    {latestAttempt.assessedLevel}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] font-bold">
                    Level {latestAttempt.assessedNumericLevel}/4
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Breakdown */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase text-[var(--text-primary)] tracking-wider">
                ANSWER REVIEW & EXPLANATIONS
              </h4>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {quiz.questions.map((q, idx) => {
                  const userAns = userAnswers[q.id];
                  const isCorrect = userAns === q.correctAnswerIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-[6px] border-2 font-mono text-xs space-y-1.5 ${isCorrect
                          ? 'border-[#19B56B]/40 bg-[#19B56B]/5'
                          : 'border-red-500/40 bg-red-500/5'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[var(--text-primary)]">
                          Q{idx + 1}. {q.question}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${isCorrect ? 'bg-[#19B56B] text-white' : 'bg-red-500 text-white'
                          }`}>
                          {isCorrect ? 'CORRECT' : 'INCORRECT'}
                        </span>
                      </div>

                      <div className="text-[11px] text-[var(--text-secondary)]">
                        Your Choice: <span className="font-bold">{q.options[userAns] || 'Not answered'}</span>
                        {!isCorrect && (
                          <span className="ml-3 text-[#19B56B] font-bold">
                            Correct Answer: {q.options[q.correctAnswerIndex]}
                          </span>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="text-[10px] italic text-[var(--text-secondary)] border-l-2 border-current pl-2 mt-1">
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t-2 border-[var(--border-main)]">
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleReset}
                icon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Retake Assessment
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-[#FFC400]"
              >
                Done & Save Result
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
