/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quiz, QuizQuestion, CatalogCompetency } from '../types';
import { isActiveCatalogCompetency, isValidCatalogCompetency } from '../utils/competencyUtils';
import { Modal, Button, Input } from './bauhaus';
import { Plus, Trash2, AlertCircle, ClipboardCheck } from 'lucide-react';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogCompetency[];
  onCreateQuiz: (quiz: Quiz) => void;
}

export default function CreateAssessmentModal({
  isOpen,
  onClose,
  catalog,
  onCreateQuiz
}: CreateAssessmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('Data Analytics & Insights Program');
  const [selectedCompetencyId, setSelectedCompetencyId] = useState('');
  const [passingScore, setPassingScore] = useState<number>(60);
  const [estimatedTime, setEstimatedTime] = useState('15 mins');
  const [error, setError] = useState<string | null>(null);

  // Default initial question
  const [questions, setQuestions] = useState<Omit<QuizQuestion, 'id'>[]>([
    {
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: ''
    }
  ]);

  if (!isOpen) return null;

  const activeCatalogOptions = catalog.filter((c) => c.isActive !== false);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].question = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = text;
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswerIndex = optIdx;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIdx: number, text: string) => {
    const updated = [...questions];
    updated[qIdx].explanation = text;
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation 1: Assessment Name
    if (!title.trim()) {
      setError('Assessment Name is required.');
      return;
    }

    // Validation 2: Competency Selection
    if (!selectedCompetencyId) {
      setError('You MUST select a target competency from the organization catalog.');
      return;
    }

    // Validation 3: Check validity and active status in catalog
    if (!isValidCatalogCompetency(selectedCompetencyId, catalog)) {
      setError('Selected competency ID does not exist in the catalog.');
      return;
    }

    if (!isActiveCatalogCompetency(selectedCompetencyId, catalog)) {
      setError('Cannot assign an inactive competency to a new assessment.');
      return;
    }

    // Validation 4: Questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} text is required.`);
        return;
      }
      const validOptions = q.options.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        setError(`Question ${i + 1} must have at least 2 non-empty options.`);
        return;
      }
    }

    const selectedComp = catalog.find((c) => c.id === selectedCompetencyId);

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: title.trim(),
      topic: description.trim() || selectedComp?.name || 'General Assessment',
      description: description.trim(),
      courseCode: 'TRN-2026',
      courseName: courseName.trim(),
      questionsCount: questions.length,
      estimatedTime: estimatedTime.trim() || '15 mins',
      passingScore: Math.min(100, Math.max(1, Number(passingScore) || 60)),
      competencyId: selectedComp?.id,
      competencyName: selectedComp?.name,
      competencyIds: [selectedComp?.id || ''],
      competencyNames: [selectedComp?.name || ''],
      status: 'available',
      createdAt: new Date().toISOString().split('T')[0],
      questions: questions.map((q, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        ...q
      }))
    };

    onCreateQuiz(newQuiz);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE COMPETENCY ASSESSMENT"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 select-none p-1">
        
        {/* Validation Error Alert */}
        {error && (
          <div className="p-3.5 rounded-[6px] border-2 border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Assessment Meta */}
        <div className="space-y-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-4 shadow-paper-xs">
          <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)] border-b border-[var(--border-main)] pb-2 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#FFC400]" />
            ASSESSMENT GENERAL INFORMATION
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="ASSESSMENT NAME *"
                type="text"
                placeholder="e.g. Data Analysis Fundamentals, Advanced Python Assessment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
                COURSE / TRAINING PROGRAM *
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Data Analytics Program"
                className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
                TARGET COMPETENCY (FROM CATALOG) *
              </label>
              <select
                value={selectedCompetencyId}
                onChange={(e) => setSelectedCompetencyId(e.target.value)}
                className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
              >
                <option value="">-- Select Active Competency --</option>
                {activeCatalogOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="PASSING SCORE (%) *"
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>

            <div>
              <Input
                label="ESTIMATED TIME *"
                type="text"
                placeholder="e.g. 15 mins"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
                ASSESSMENT DESCRIPTION
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of what this assessment evaluates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2 text-xs font-mono text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-2">
            <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
              QUESTIONS & MULTIPLE CHOICE OPTIONS ({questions.length})
            </h4>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={handleAddQuestion}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Question
            </Button>
          </div>

          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] space-y-3 shadow-paper-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading font-extrabold text-xs text-[var(--text-primary)] uppercase">
                    QUESTION #{qIdx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-red-500 hover:text-red-700 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder={`Enter question ${qIdx + 1} text...`}
                  value={q.question}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                />

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctAnswerIndex === optIdx}
                        onChange={() => handleCorrectAnswerChange(qIdx, optIdx)}
                        className="cursor-pointer shrink-0"
                        title="Mark as Correct Answer"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}...`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                        className={`w-full rounded-[4px] border p-1.5 text-xs font-mono ${
                          q.correctAnswerIndex === optIdx
                            ? 'border-[#19B56B] bg-[#19B56B]/10 font-bold'
                            : 'border-[var(--border-main)] bg-[var(--bg-main)]'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Optional answer explanation..."
                  value={q.explanation || ''}
                  onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                  className="w-full rounded-[4px] border border-[var(--border-main)] bg-[var(--bg-main)] p-1.5 text-[11px] font-mono text-[var(--text-secondary)] italic outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t-2 border-[var(--border-main)]">
          <Button type="button" variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" size="sm" className="bg-[#FFC400]">
            Create Assessment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
