/**
 * Project Kuma - Ungraded Practice & Flashcards Component
 * Low-stakes, retryable practice step between Learn and Assess.
 * Visually distinct from graded assessments.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';
import { PracticeQuestion, FlashcardItem, PracticeResult } from '../types';
import { savePracticeResult } from '../services/practiceService';
import { convertQuestionsToFlashcards, orderFlashcards } from '../utils/flashcardUtils';
import { TraineeButton } from './trainee/TraineeUI';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  questions: PracticeQuestion[];
  onCompletePractice?: (result: PracticeResult) => void;
}

export default function PracticeModal({
  isOpen,
  onClose,
  uid,
  courseId,
  moduleId,
  moduleTitle,
  questions,
  onCompletePractice
}: PracticeModalProps) {
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards'>('quiz');

  // Quiz mode state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [answersMap, setAnswersMap] = useState<Record<string, { optionId: string; isCorrect: boolean }>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [savedResult, setSavedResult] = useState<PracticeResult | null>(null);

  // Flashcards mode state
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(() =>
    convertQuestionsToFlashcards(questions)
  );
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset states when questions change
  const currentQuestion = questions[currentIndex] || questions[0];

  const currentOption = useMemo(() => {
    if (!currentQuestion) return null;
    return currentQuestion.options.find((o) => o.id === selectedOptionId);
  }, [currentQuestion, selectedOptionId]);

  if (!isOpen || questions.length === 0) return null;

  const handleCheckAnswer = () => {
    if (!selectedOptionId || !currentQuestion) return;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { optionId: selectedOptionId, isCorrect }
    }));
    setIsAnswerChecked(true);
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerChecked(false);
    } else {
      // Finished quiz practice mode
      const correctCount = Object.values(answersMap).filter((a) => a.isCorrect).length;
      const scorePct = Math.round((correctCount / questions.length) * 100);
      const missedIds = questions
        .filter((q) => answersMap[q.id] && !answersMap[q.id].isCorrect)
        .map((q) => q.id);

      const res = await savePracticeResult(uid, courseId, moduleId, scorePct, missedIds);
      setSavedResult(res);
      setIsFinished(true);
      onCompletePractice?.(res);
    }
  };

  const handleRetryQuiz = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswerChecked(false);
    setAnswersMap({});
    setIsFinished(false);
    setSavedResult(null);
  };

  // Flashcard Actions
  const currentFlashcard = flashcards[flashcardIndex];

  const handleMarkFlashcard = (status: 'know_it' | 'review_again') => {
    if (!currentFlashcard) return;

    const updatedCard: FlashcardItem = {
      ...currentFlashcard,
      status,
      lastReviewedAt: Date.now()
    };

    const newCards = [...flashcards];
    newCards[flashcardIndex] = updatedCard;

    // Apply spaced review ordering
    const reordered = orderFlashcards(newCards);
    setFlashcards(reordered);
    setIsFlipped(false);

    if (flashcardIndex < reordered.length - 1) {
      setFlashcardIndex((prev) => prev + 1);
    } else {
      setFlashcardIndex(0); // loop around with updated spaced order
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Distinct Ungraded Practice Branding */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-panel/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-brand-violet/30 bg-brand-violet/10 px-2 py-0.5 font-mono text-[10px] font-bold text-brand-violet uppercase tracking-wider">
                  Ungraded Practice Step
                </span>
                <span className="text-xs text-muted">No penalty • Unlimited retries</span>
              </div>
              <h2 className="text-base font-bold text-ink truncate max-w-md mt-0.5">
                Practice: {moduleTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-faint hover:bg-panel hover:text-ink transition-colors cursor-pointer"
            aria-label="Close practice"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-line bg-panel/20 px-6 pt-2">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'quiz'
                ? 'border-brand-violet text-brand-violet'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <HelpCircle size={14} /> Interactive Quiz Practice
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'flashcards'
                ? 'border-brand-violet text-brand-violet'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Layers size={14} /> Spaced Review Flashcards ({flashcards.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'quiz' ? (
            !isFinished ? (
              /* Quiz Practice View */
              <div className="space-y-6">
                {/* Question Progress & Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted font-mono">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>Practice Mode</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink leading-relaxed">
                    {currentQuestion.questionText}
                  </h3>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrect = option.id === currentQuestion.correctOptionId;

                    let optionStyle = 'border-line bg-card hover:border-brand-violet/50 hover:bg-panel/50 text-ink';

                    if (isAnswerChecked) {
                      if (isCorrect) {
                        optionStyle = 'border-brand-emerald bg-brand-emerald/10 text-brand-emerald font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-brand-rose bg-brand-rose/10 text-brand-rose';
                      } else {
                        optionStyle = 'border-line opacity-50 text-faint';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-brand-violet bg-brand-violet/10 text-brand-violet font-semibold ring-1 ring-brand-violet/40';
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedOptionId(option.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all cursor-pointer disabled:cursor-default ${optionStyle}`}
                      >
                        <span>{option.text}</span>
                        {isAnswerChecked && isCorrect && <CheckCircle2 size={16} className="text-brand-emerald" />}
                        {isAnswerChecked && isSelected && !isCorrect && <XCircle size={16} className="text-brand-rose" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Banner (Instant Feedback) */}
                {isAnswerChecked && (
                  <div className="rounded-xl border border-brand-violet/30 bg-brand-violet/5 p-4 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-violet">
                      <Sparkles size={14} /> Practice Explanation
                    </div>
                    <p className="text-xs text-ink leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Quiz Practice Summary */
              <div className="py-6 text-center space-y-6 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
                  <Award size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-ink">
                    Practice Complete!
                  </h3>
                  <div className="text-3xl font-extrabold text-brand-violet">
                    {savedResult?.lastScore}% Score
                  </div>
                  <p className="text-sm text-muted max-w-md mx-auto">
                    You're getting <strong className="text-ink">{moduleTitle}</strong> right {savedResult?.lastScore}% — ready for the assessment!
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-panel p-4 max-w-md mx-auto text-xs text-muted text-left space-y-1">
                  <div className="font-semibold text-ink">Readiness Insight</div>
                  <p>Practice attempts are low-stakes and do not alter your official competency records or certificates.</p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <TraineeButton
                    variant="secondary"
                    iconLeft={<RotateCcw size={14} />}
                    onClick={handleRetryQuiz}
                  >
                    Retry Practice
                  </TraineeButton>
                  <TraineeButton
                    variant="primary"
                    iconRight={<ArrowRight size={14} />}
                    onClick={onClose}
                  >
                    Done
                  </TraineeButton>
                </div>
              </div>
            )
          ) : (
            /* Flashcards Mode */
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between text-xs text-muted font-mono">
                <span>Card {flashcardIndex + 1} of {flashcards.length}</span>
                <span>Spaced Review Priority</span>
              </div>

              {currentFlashcard ? (
                <div className="space-y-4">
                  {/* Flip Card Surface */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative h-64 w-full cursor-pointer rounded-2xl border border-line bg-panel/40 p-6 flex flex-col justify-between shadow-sm transition-all hover:border-brand-violet/50 select-none"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-card px-2 py-0.5 font-mono text-[10px] font-bold text-muted border border-line">
                        {isFlipped ? 'BACK (ANSWER)' : 'FRONT (QUESTION)'}
                      </span>
                      {currentFlashcard.status === 'review_again' && (
                        <span className="rounded bg-brand-rose/10 px-2 py-0.5 text-[10px] font-bold text-brand-rose">
                          Needs Review
                        </span>
                      )}
                    </div>

                    <div className="my-auto text-center space-y-3">
                      {!isFlipped ? (
                        <h4 className="text-base font-bold text-ink leading-relaxed">
                          {currentFlashcard.questionText}
                        </h4>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-base font-bold text-brand-emerald">
                            {currentFlashcard.answerText}
                          </h4>
                          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                            {currentFlashcard.explanation}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[11px] text-faint flex items-center justify-center gap-1">
                      <RefreshCw size={12} /> Click card to flip
                    </div>
                  </div>

                  {/* Feedback Buttons */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => handleMarkFlashcard('review_again')}
                      className="flex items-center gap-2 rounded-xl border border-brand-rose/30 bg-brand-rose/10 px-4 py-2.5 text-xs font-semibold text-brand-rose hover:bg-brand-rose/20 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={14} /> Review Again
                    </button>
                    <button
                      onClick={() => handleMarkFlashcard('know_it')}
                      className="flex items-center gap-2 rounded-xl border border-brand-emerald/30 bg-brand-emerald/10 px-4 py-2.5 text-xs font-semibold text-brand-emerald hover:bg-brand-emerald/20 transition-colors cursor-pointer"
                    >
                      <ThumbsUp size={14} /> Know It
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-muted py-8">
                  All flashcards reviewed!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (Quiz Controls) */}
        {activeTab === 'quiz' && !isFinished && (
          <div className="flex items-center justify-between border-t border-line px-6 py-4 bg-panel/30">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setSelectedOptionId(null);
                  setIsAnswerChecked(false);
                }
              }}
              disabled={currentIndex === 0}
              className="text-xs font-semibold text-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>

            <div className="flex items-center gap-3">
              {!isAnswerChecked ? (
                <TraineeButton
                  variant="primary"
                  disabled={!selectedOptionId}
                  onClick={handleCheckAnswer}
                >
                  Check Answer
                </TraineeButton>
              ) : (
                <TraineeButton
                  variant="primary"
                  iconRight={<ArrowRight size={14} />}
                  onClick={handleNextQuestion}
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}
                </TraineeButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
