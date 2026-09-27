/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NormalizedLectureResources {
  title: string;
  transcript: string;
  cleanTranscript: string;
  summary: string;
  summaries: Record<string, string>;
  notes: Array<{ title: string; content: string; keyPoints?: string[] }>;
  quizzes: any[];
  flashcards: Array<{ id: string; front: string; back: string }>;
  mindMap?: any;
  timeline?: any[];
  sections?: any[];
  hasNotes: boolean;
  hasSummary: boolean;
  hasQuizzes: boolean;
  hasFlashcards: boolean;
}

/**
 * Normalizes legacy or variant lecture document structures from Firestore into
 * a single canonical resource contract across all frontend screens.
 */
export function normalizeLectureResources(lecture: any): NormalizedLectureResources {
  if (!lecture) {
    return {
      title: 'Untitled Lecture',
      transcript: '',
      cleanTranscript: '',
      summary: '',
      summaries: {},
      notes: [],
      quizzes: [],
      flashcards: [],
      hasNotes: false,
      hasSummary: false,
      hasQuizzes: false,
      hasFlashcards: false
    };
  }

  const summaries: Record<string, string> = {};
  if (lecture.summaries && typeof lecture.summaries === 'object') {
    Object.assign(summaries, lecture.summaries);
  }
  if (typeof lecture.summary === 'string' && lecture.summary.trim()) {
    summaries['quick_revision'] = summaries['quick_revision'] || lecture.summary;
    summaries['academic_format'] = summaries['academic_format'] || lecture.summary;
  }

  const primarySummary = 
    summaries['academic_format'] || 
    summaries['quick_revision'] || 
    summaries['detailed_notes'] || 
    summaries['executive_summary'] || 
    (typeof lecture.summary === 'string' ? lecture.summary : '');

  let notes: Array<{ title: string; content: string; keyPoints?: string[] }> = [];
  if (Array.isArray(lecture.notes)) {
    notes = lecture.notes;
  } else if (lecture.notes && typeof lecture.notes === 'object') {
    if (Array.isArray(lecture.notes.academic)) {
      notes = lecture.notes.academic;
    } else if (typeof lecture.notes.content === 'string') {
      notes = [{ title: lecture.title || 'Study Notes', content: lecture.notes.content }];
    }
  } else if (Array.isArray(lecture.sections) && lecture.sections.length > 0) {
    notes = lecture.sections.map((s: any) => ({
      title: s.title || s.heading || 'Section',
      content: s.content || s.summary || s.text || '',
      keyPoints: s.keyPoints || s.highlights || []
    }));
  }

  const quizzes = Array.isArray(lecture.quizzes) 
    ? lecture.quizzes 
    : (Array.isArray(lecture.quiz) ? lecture.quiz : []);

  const flashcards = Array.isArray(lecture.flashcards)
    ? lecture.flashcards
    : (Array.isArray(lecture.cards) ? lecture.cards : []);

  return {
    title: lecture.title || 'Untitled Lecture',
    transcript: lecture.transcript || '',
    cleanTranscript: lecture.cleanTranscript || lecture.transcript || '',
    summary: primarySummary,
    summaries,
    notes,
    quizzes,
    flashcards,
    mindMap: lecture.mindMap || lecture.mindmap || null,
    timeline: lecture.timeline || [],
    sections: lecture.sections || [],
    hasNotes: notes.length > 0 || (typeof lecture.cleanTranscript === 'string' && lecture.cleanTranscript.trim().length > 0),
    hasSummary: Object.keys(summaries).length > 0 || primarySummary.length > 0,
    hasQuizzes: quizzes.length > 0,
    hasFlashcards: flashcards.length > 0
  };
}
