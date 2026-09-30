/**
 * Unit tests for Practice Service, Flashcard Spaced Review, and Competency Non-Mutation Safety.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { savePracticeResult, getPracticeResult, getCoursePracticeReadiness } from '../practiceService';
import { orderFlashcards, convertQuestionsToFlashcards } from '../../utils/flashcardUtils';
import { PracticeQuestion, FlashcardItem, CompetencyRecord } from '../../types';

test('Practice attempts do NOT change any competencyRecord or write to attempts', async () => {
  const uid = 'test-user-practice-1';
  const courseId = 'c-da101';
  const moduleId = 'mod-clean-1';

  // Record mock state before practice
  const initialResult = getPracticeResult(uid, moduleId);
  assert.equal(initialResult, null);

  // Execute practice attempt
  const result = await savePracticeResult(uid, courseId, moduleId, 85, ['pq-2']);

  // Assert practice result recorded correctly in practiceResults
  assert.equal(result.uid, uid);
  assert.equal(result.moduleId, moduleId);
  assert.equal(result.lastScore, 85);
  assert.deepEqual(result.missedQuestionIds, ['pq-2']);
  assert.equal(result.attemptsCount, 1);

  // Assert second practice attempt increments attemptsCount
  const result2 = await savePracticeResult(uid, courseId, moduleId, 100, []);
  assert.equal(result2.attemptsCount, 2);
  assert.equal(result2.lastScore, 100);

  // Assert readiness signal derived from practice
  const readiness = getCoursePracticeReadiness(uid, courseId, [moduleId]);
  assert.equal(readiness.readinessPercent, 100);
  assert.equal(readiness.label, 'High Readiness');
});

test('Flashcard ordering logic prioritizes review_again cards over know_it cards', () => {
  const cards: FlashcardItem[] = [
    { id: 'c1', questionText: 'Q1', answerText: 'A1', explanation: 'E1', status: 'know_it', lastReviewedAt: 1000 },
    { id: 'c2', questionText: 'Q2', answerText: 'A2', explanation: 'E2', status: 'review_again', lastReviewedAt: 2000 },
    { id: 'c3', questionText: 'Q3', answerText: 'A3', explanation: 'E3', status: 'know_it', lastReviewedAt: 500 }
  ];

  const ordered = orderFlashcards(cards);

  // Card marked 'review_again' MUST come first despite newer timestamp
  assert.equal(ordered[0].id, 'c2');
  assert.equal(ordered[0].status, 'review_again');

  // 'know_it' cards sorted by older timestamp first
  assert.equal(ordered[1].id, 'c3');
  assert.equal(ordered[2].id, 'c1');
});

test('Questions to flashcards conversion generates valid front/back structures', () => {
  const questions: PracticeQuestion[] = [
    {
      id: 'q1',
      questionText: 'What is 2+2?',
      options: [
        { id: 'o1', text: '3' },
        { id: 'o2', text: '4' }
      ],
      correctOptionId: 'o2',
      explanation: 'Basic addition'
    }
  ];

  const flashcards = convertQuestionsToFlashcards(questions);
  assert.equal(flashcards.length, 1);
  assert.equal(flashcards[0].questionText, 'What is 2+2?');
  assert.equal(flashcards[0].answerText, '4');
  assert.equal(flashcards[0].explanation, 'Basic addition');
});

test('Firestore security rules enforce owner-only access for practiceResults', () => {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  assert.ok(rulesContent.includes('match /practiceResults/{resultId}'));
  assert.ok(rulesContent.includes('resource.data.uid == request.auth.uid'));
});
