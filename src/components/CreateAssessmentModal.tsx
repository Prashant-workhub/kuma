/**
 * Project Kuma - Assessment Builder Component
 * Spec: Two-pane editor (question list on left, editor on right), preview, settings (time limit, attempts, pass mark),
 * competency mapping, autosave draft state indicator ("Saved", "Saving...", "Save failed - Retry"), publish flow with validation summary.
 */

import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, CatalogCompetency } from '../types';
import { createOrUpdateAssessment } from '../services/assessmentService';
import {
  Button,
  Card,
  Input,
  FormField,
  Select,
  Badge,
  Dialog,
  DialogContent,
  InlineAlert,
  ConfirmDialog,
} from './ui';
import { Plus, Trash2, CheckCircle2, Save, Eye, Layers } from 'lucide-react';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogCompetency[];
  onCreateQuiz: (quiz: Quiz) => Promise<void> | void;
}

export default function CreateAssessmentModal({
  isOpen,
  onClose,
  catalog,
  onCreateQuiz,
}: CreateAssessmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompetencyId, setSelectedCompetencyId] = useState('');
  const [passingScore, setPassingScore] = useState<number>(60);
  const [timeLimit, setTimeLimit] = useState('15 mins');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [error, setError] = useState<string | null>(null);

  // Draft autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'Saved' | 'Saving...' | 'Save failed - Retry'>('Saved');

  // Selected question index for Two-Pane Editor
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [questions, setQuestions] = useState<Omit<QuizQuestion, 'id'>[]>([
    {
      type: 'mcq',
      question: 'What is the primary function of Docker containerization?',
      options: ['Resource isolation & portability', 'Database backup', 'Hardware emulation', 'Network routing'],
      correctAnswerIndex: 0,
      explanation: 'Containers isolate processes and dependencies to guarantee consistent execution environments.',
    },
  ]);

  // Autosave simulator
  useEffect(() => {
    if (!title && questions.length === 0) return;
    setAutosaveStatus('Saving...');
    const timer = setTimeout(() => {
      setAutosaveStatus('Saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [title, description, selectedCompetencyId, passingScore, questions]);

  if (!isOpen) return null;

  const activeCatalogOptions = catalog.filter((c) => c.isActive !== false);
  const currentQ = questions[activeQIndex] || questions[0];

  const handleAddQuestion = () => {
    const newQ = {
      type: 'mcq' as const,
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    setActiveQIndex(Math.max(0, idx - 1));
  };

  // Validation Summary Checklist
  const validationChecklist = [
    { label: 'Assessment title provided', passed: !!title.trim() },
    { label: 'Target competency mapped', passed: !!selectedCompetencyId },
    { label: 'At least 1 complete question created', passed: questions.some((q) => q.question.trim().length > 0) },
  ];
  const isValidToPublish = validationChecklist.every((c) => c.passed);

  const handlePublish = async () => {
    setError(null);
    setIsPublishing(true);
    try {
      const selectedComp = catalog.find((c) => c.id === selectedCompetencyId);
      const newQuiz: Quiz = {
        id: `quiz_${Date.now()}`,
        title: title.trim(),
        topic: selectedComp?.name || 'General Assessment',
        courseName: 'Technical Competency Program',
        courseCode: 'CS-101',
        competencyId: selectedCompetencyId,
        competencyName: selectedComp?.name || 'General Competency',
        estimatedTime: timeLimit,
        passingScore,
        questionsCount: questions.length,
        status: 'available',
        questions: questions.map((q, i) => ({
          ...q,
          id: `q_${i + 1}`,
        })),
      };

      await createOrUpdateAssessment(newQuiz);
      await onCreateQuiz(newQuiz);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Publishing failed. Please try again.');
    } finally {
      setIsPublishing(false);
      setShowPublishConfirm(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="info">Assessment Builder</Badge>
              {/* AUTOSAVE DRAFT STATE INDICATOR */}
              <span className={`text-xs font-mono font-semibold ${autosaveStatus === 'Saved' ? 'text-success' : autosaveStatus === 'Saving...' ? 'text-warning' : 'text-danger'}`}>
                Draft: {autosaveStatus}
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight mt-0.5">
              Create Competency Assessment
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              <Eye className="h-4 w-4 mr-1.5" />
              {isPreviewMode ? 'Back to Editor' : 'Preview'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowPublishConfirm(true)}>
              Publish assessment
            </Button>
          </div>
        </div>

        {error && <InlineAlert variant="danger">{error}</InlineAlert>}

        {/* EDITOR vs PREVIEW MODE */}
        {!isPreviewMode ? (
          <div className="space-y-6">
            {/* SETTINGS BAR: Time limit, attempts, pass mark, competency mapping */}
            <Card className="p-4 bg-surface-muted border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <FormField label="Assessment Title" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kubernetes Core Quiz" />
              </FormField>
              <FormField label="Target Competency" required>
                <Select
                  value={selectedCompetencyId}
                  onChange={(e) => setSelectedCompetencyId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Competency...' },
                    ...activeCatalogOptions.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </FormField>
              <FormField label="Passing Score (%)">
                <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
              </FormField>
              <FormField label="Time Limit">
                <Select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  options={[
                    { value: '10 mins', label: '10 minutes' },
                    { value: '15 mins', label: '15 minutes' },
                    { value: '30 mins', label: '30 minutes' },
                  ]}
                />
              </FormField>
            </Card>

            {/* TWO-PANE EDITOR */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* LEFT PANE: Question List Navigator */}
              <div className="md:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                  <span>Questions ({questions.length})</span>
                  <Button variant="ghost" size="sm" onClick={handleAddQuestion}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveQIndex(idx)}
                      className={`p-3 rounded-container border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                        idx === activeQIndex
                          ? 'border-primary bg-primary/10 font-semibold text-text-primary'
                          : 'border-border bg-surface hover:bg-surface-muted text-text-secondary'
                      }`}
                    >
                      <span className="truncate flex-1 pr-2">
                        {idx + 1}. {q.question.trim() || 'Untitled Question'}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestion(idx);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-danger" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT PANE: Selected Question Editor */}
              <div className="md:col-span-8 space-y-4">
                {currentQ && (
                  <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Editing Question {activeQIndex + 1}
                    </h3>

                    <FormField label="Question Statement" required>
                      <Input
                        value={currentQ.question}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[activeQIndex].question = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Enter question prompt..."
                      />
                    </FormField>

                    {/* Options */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-secondary">Answer Choices (Select correct choice)</label>
                      {currentQ.options.map((optText, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${activeQIndex}`}
                            checked={currentQ.correctAnswerIndex === optIdx}
                            onChange={() => {
                              const updated = [...questions];
                              updated[activeQIndex].correctAnswerIndex = optIdx;
                              setQuestions(updated);
                            }}
                            className="h-4 w-4 text-primary"
                          />
                          <Input
                            value={optText}
                            onChange={(e) => {
                              const updated = [...questions];
                              const opts = [...updated[activeQIndex].options];
                              opts[optIdx] = e.target.value;
                              updated[activeQIndex].options = opts;
                              setQuestions(updated);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>

                    <FormField label="Answer Explanation">
                      <Input
                        value={currentQ.explanation}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[activeQIndex].explanation = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Provide reasoning for correct answer..."
                      />
                    </FormField>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* PREVIEW MODE */
          <div className="space-y-4 p-4 rounded-container border border-border bg-surface-muted">
            <h3 className="text-base font-semibold text-text-primary">Assessment Preview</h3>
            {questions.map((q, idx) => (
              <Card key={idx} className="p-4 space-y-2">
                <div className="font-semibold text-xs text-text-primary">{idx + 1}. {q.question}</div>
                <div className="space-y-1 text-xs text-text-secondary">
                  {q.options.map((o, oIdx) => (
                    <div key={oIdx} className={oIdx === q.correctAnswerIndex ? 'font-bold text-success' : ''}>
                      • {o} {oIdx === q.correctAnswerIndex && '(Correct)'}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* PUBLISH FLOW CONFIRMDALOG WITH VALIDATION SUMMARY */}
        <ConfirmDialog
          open={showPublishConfirm}
          onOpenChange={setShowPublishConfirm}
          title="Publish Competency Assessment?"
          description={
            <div className="space-y-3 text-xs text-text-secondary text-left mt-2">
              <p>Review validation checklist before publishing:</p>
              <div className="space-y-2">
                {validationChecklist.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${c.passed ? 'text-success' : 'text-danger'}`} />
                    <span className={c.passed ? 'text-text-primary' : 'text-danger font-medium'}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          }
          confirmText="Publish Assessment"
          cancelText="Keep Editing"
          isLoading={isPublishing}
          onConfirm={() => {
            if (!isValidToPublish) return;
            handlePublish();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
