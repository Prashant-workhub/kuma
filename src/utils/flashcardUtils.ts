/**
 * Project Kuma - Spaced Review Flashcard Utility
 * Handles ordering and transformation of practice questions into flashcards.
 */

import { PracticeQuestion, FlashcardItem } from '../types';

/**
 * Transforms a list of practice questions into flashcards.
 */
export function convertQuestionsToFlashcards(questions: PracticeQuestion[]): FlashcardItem[] {
  return questions.map((q) => {
    const correctOpt = q.options.find((o) => o.id === q.correctOptionId);
    return {
      id: q.id,
      questionText: q.questionText,
      answerText: correctOpt ? correctOpt.text : 'Answer not specified',
      explanation: q.explanation,
      status: undefined,
      lastReviewedAt: undefined
    };
  });
}

/**
 * Orders flashcards for spaced review.
 * Cards marked 'review_again' are prioritized before 'know_it' cards.
 * Among 'review_again' cards, older/unreviewed cards come first.
 */
export function orderFlashcards(cards: FlashcardItem[]): FlashcardItem[] {
  return [...cards].sort((a, b) => {
    // 1. Prioritize 'review_again' over 'know_it'
    const statusPriority = (status?: string) => {
      if (status === 'review_again') return 0;
      if (!status) return 1; // Unreviewed
      return 2; // 'know_it'
    };

    const prioA = statusPriority(a.status);
    const prioB = statusPriority(b.status);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // 2. Secondary sort: older lastReviewedAt timestamp first
    const timeA = a.lastReviewedAt || 0;
    const timeB = b.lastReviewedAt || 0;
    return timeA - timeB;
  });
}
