/**
 * Project Kuma - Ungraded Practice & Flashcards Component
 * Low-stakes, retryable practice step between Learn and Assess.
 * Spec: One question per screen, immediate feedback in InlineAlert,
 * clear "Practice - not graded" badge, flashcards with keyboard shortcuts (space to flip, arrows).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { PracticeQuestion, FlashcardItem, PracticeResult } from '../types';
import { savePracticeResult } from '../services/practiceService';
import { convertQuestionsToFlashcards, orderFlashcards } from '../utils/flashcardUtils';
import {
  Button,
  Badge,
  InlineAlert,
  ProgressBar,
  Card,
  SegmentedControl,
  Dialog,
  DialogContent,
} from './ui';

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
  onCompletePractice,
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

  // Current question
  const currentQuestion = questions[currentIndex] || questions[0];

  // Keyboard shortcut listeners for Flashcards mode (Space to flip, Left/Right arrows)
  useEffect(() => {
    if (!isOpen || activeTab !== 'flashcards') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (flashcardIndex < flashcards.length - 1) {
          setFlashcardIndex((prev) => prev + 1);
          setIsFlipped(false);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (flashcardIndex > 0) {
          setFlashcardIndex((prev) => prev - 1);
          setIsFlipped(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, flashcardIndex, flashcards.length]);

  if (!isOpen || questions.length === 0) return null;

  const handleCheckAnswer = () => {
    if (!selectedOptionId || !currentQuestion) return;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { optionId: selectedOptionId, isCorrect },
    }));
    setIsAnswerChecked(true);
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerChecked(false);
    } else {
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

  const currentFlashcard = flashcards[flashcardIndex];

  const handleMarkFlashcard = (status: 'know_it' | 'review_again') => {
    if (!currentFlashcard) return;
    const updated = flashcards.map((f, i) =>
      i === flashcardIndex ? { ...f, status } : f
    );
    setFlashcards(orderFlashcards(updated));
    setIsFlipped(false);

    if (flashcardIndex < flashcards.length - 1) {
      setFlashcardIndex((prev) => prev + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="warning">Practice - not graded</Badge>
              <span className="text-xs text-text-tertiary">{moduleTitle}</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">
              Module Practice & Reinforcement
            </h2>
          </div>

          <SegmentedControl
            options={[
              { value: 'quiz', label: 'Questions' },
              { value: 'flashcards', label: 'Flashcards' },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            size="sm"
          />
        </div>

        {/* MODE A: Ungraded Quiz (One question per screen) */}
        {activeTab === 'quiz' && (
          <div className="space-y-5">
            {!isFinished ? (
              <>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span className="font-mono">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                  </div>
                  <ProgressBar value={((currentIndex + 1) / questions.length) * 100} size="sm" />
                </div>

                {/* Question Card */}
                <Card className="p-5 space-y-4">
                  <h3 className="font-semibold text-text-primary text-base leading-relaxed">
                    {currentQuestion.questionText}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      const isCorrect = opt.id === currentQuestion.correctOptionId;

                      let styleClass = 'border-border hover:bg-surface-muted text-text-primary';
                      if (isAnswerChecked) {
                        if (isCorrect) styleClass = 'border-success bg-success-subtle text-text-primary font-medium';
                        else if (isSelected && !isCorrect) styleClass = 'border-danger bg-danger-subtle text-text-primary';
                      } else if (isSelected) {
                        styleClass = 'border-primary bg-primary/10 font-medium text-text-primary';
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isAnswerChecked}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`w-full text-left p-3.5 rounded-container border text-xs transition-colors flex items-center justify-between ${styleClass}`}
                        >
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Feedback in InlineAlert */}
                  {isAnswerChecked && (
                    <InlineAlert
                      variant={selectedOptionId === currentQuestion.correctOptionId ? 'success' : 'danger'}
                      title={selectedOptionId === currentQuestion.correctOptionId ? 'Correct answer!' : 'Incorrect'}
                    >
                      {currentQuestion.explanation}
                    </InlineAlert>
                  )}
                </Card>

                {/* Footer Action */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {!isAnswerChecked ? (
                    <Button
                      variant="primary"
                      disabled={!selectedOptionId}
                      onClick={handleCheckAnswer}
                    >
                      Check answer
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleNextQuestion}
                    >
                      {currentIndex < questions.length - 1 ? 'Next question' : 'Finish practice'}
                      <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* Finished State */
              <Card className="p-6 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-success-subtle flex items-center justify-center text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-text-primary">Practice completed!</h3>
                  <p className="text-xs text-text-secondary">
                    Your readiness score: <strong className="text-text-primary">{savedResult?.lastScore}%</strong>.
                    Practice is ungraded and you can retry as many times as needed.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="secondary" onClick={handleRetryQuiz}>
                    <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" /> Retry practice
                  </Button>
                  <Button variant="primary" onClick={onClose}>
                    Done
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* MODE B: Flashcards (Keyboard shortcuts enabled) */}
        {activeTab === 'flashcards' && currentFlashcard && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Flashcard {flashcardIndex + 1} of {flashcards.length}</span>
              <span className="text-text-tertiary">Keys: Space to flip, ← / → to move</span>
            </div>

            <Card
              className="p-8 min-h-[220px] flex flex-col items-center justify-center text-center cursor-pointer select-none hover:border-primary/50 transition-colors"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <Badge variant="info" className="mb-3">
                {isFlipped ? 'Answer / Explanation' : 'Question (Click or Press Space to flip)'}
              </Badge>
              <p className="text-base font-medium text-text-primary max-w-md">
                {isFlipped ? currentFlashcard.answerText : currentFlashcard.questionText}
              </p>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                disabled={flashcardIndex <= 0}
                onClick={() => { setFlashcardIndex((prev) => prev - 1); setIsFlipped(false); }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="danger" size="sm" onClick={() => handleMarkFlashcard('review_again')}>
                  Review again
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleMarkFlashcard('know_it')}>
                  Got it!
                </Button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={flashcardIndex >= flashcards.length - 1}
                onClick={() => { setFlashcardIndex((prev) => prev + 1); setIsFlipped(false); }}
              >
                Next <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
