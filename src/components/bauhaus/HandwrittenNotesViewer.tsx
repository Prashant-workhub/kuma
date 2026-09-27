/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Download, ArrowRight, Sparkles, BookOpen, CheckCircle, FileText, PenTool } from 'lucide-react';
import { detectAndConvertVerticalTables } from './AcademicNotesViewer';
import { formatNotesWithAI } from '../../services/gemini';

interface HandwrittenNotesViewerProps {
  lectureData: any;
  theme?: 'light' | 'dark';
  isCompiling?: boolean;
}

function cleanMarkdownText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[Source:\s*[^\]]+\]/g, '')
    .replace(/(Learning Objectives|Learning Outcomes|Lecture|Course Outcomes|Course Outcome)?\s*SLIDE\s*\d+\s*\/\s*\d+\s*(Chandigarh University|\w+\s+University)?\s*\d*\s*\/?\s*\d*/gi, '')
    .replace(/(Chandigarh University|\b[A-Z][a-z]+\s+University)\s*\d*\s*\/?\s*\d*/gi, '')
    .replace(/SLIDE\s*\d+\s*\/\s*\d+/gi, '')
    .replace(/SLIDE\s*\d+/gi, '')
    .replace(/(\bCO[1-6]\b|\bBT[1-6]\b|\bBT LEVEL\b|\bCourse OutcomeCO\b|\bDESCRIPTION CO[1-6]\b)[^\n]*/gi, '')
    .replace(/Source:\s*media\.geeksforgeeks\.org/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Condenses long verbatim text paragraphs into crisp, high-yield academic study bullets.
 */
function condenseTextToAcademicBullets(text: string, maxBulletsPerBlock = 4): string[] {
  if (!text) return [];

  // Remove filler words & conversational phrases
  let clean = text
    .replace(/\b(so basically|you know|um+|uh+|like i said|in this lecture|welcome to|let's talk about|we are going to|today we will|as we know|in terms of|kind of|sort of|basically|actually)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.length > 8);
  if (sentences.length === 0) return clean ? [clean] : [];

  const bullets: string[] = [];
  sentences.forEach(sentence => {
    let trimmed = cleanMarkdownText(sentence);
    if (!trimmed) return;

    // Cap long sentences to concise bullet length (max 18 words)
    const words = trimmed.split(' ');
    if (words.length > 18) {
      trimmed = words.slice(0, 16).join(' ') + '...';
    }

    if (trimmed.length > 6) {
      const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      if (!bullets.includes(formatted)) {
        bullets.push(formatted);
      }
    }
  });

  return bullets.slice(0, maxBulletsPerBlock);
}

/**
 * Converts structured notes arrays or markdown strings into standardized Markdown text.
 */
function notesToMarkdown(notes: unknown, fallbackTitle = 'Lecture Study Notes'): string {
  if (typeof notes === 'string') return notes;
  if (!Array.isArray(notes)) return '';

  const topics = notes
    .map((note: any) => {
      if (typeof note === 'string') return note.trim();
      if (!note || typeof note !== 'object') return '';

      const heading = cleanMarkdownText(note.title || note.heading || 'Key Concept');
      const content = typeof note.content === 'string'
        ? note.content
        : typeof note.text === 'string'
          ? note.text
          : typeof note.explanation === 'string'
            ? note.explanation
            : Array.isArray(note.details)
              ? note.details.filter((item: unknown) => typeof item === 'string').map(item => `- ${item}`).join('\n')
              : '';

      return content.trim() ? `## ${heading}\n${content.trim()}` : '';
    })
    .filter(Boolean);

  return topics.length ? `# ${fallbackTitle}\n\n${topics.join('\n\n')}` : '';
}

interface HandwrittenItem {
  id?: string;
  title?: string;
  type: 'text' | 'concept' | 'diagram' | 'formula' | 'terms' | 'bullets' | 'table' | 'remember' | 'examFocus' | 'definition' | 'example';
  content: any;
  table?: Array<{ col1: string; col2: string }>;
  tableData?: { headers: string[]; rows: string[][] };
  weight: number; // Height budget weight units for A4 bin-packing
}

interface HandwrittenSectionData {
  title: string;
  items: HandwrittenItem[];
}

function parseMarkdownToHandwrittenSections(rawMarkdown: string) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') {
    return { title: '', overview: '', keyPoints: [], sections: [], remember: '', examFocus: '', formulas: [], definitions: [], examples: [] };
  }

  const cleanedMarkdown = detectAndConvertVerticalTables(rawMarkdown);
  const lines = cleanedMarkdown.split('\n');
  let title = '';
  let overview = '';
  const keyPoints: string[] = [];
  const formulas: string[] = [];
  const definitions: string[] = [];
  const examples: string[] = [];
  let remember = '';
  let examFocus = '';

  const sections: HandwrittenSectionData[] = [];

  let currentTitle = '';
  let currentContentLines: string[] = [];
  let currentTable: Array<{ col1: string; col2: string }> = [];
  let currentTableData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };

  const flushSection = () => {
    if (currentTitle || currentContentLines.length > 0 || currentTable.length > 0 || currentTableData.headers.length > 0) {
      const items: HandwrittenItem[] = [];
      const linesArr = currentContentLines.map(l => cleanMarkdownText(l)).filter(Boolean);

      const textLines: string[] = [];

      linesArr.forEach((line) => {
        if (/^(definition|defined as|principle|concept):/i.test(line) || /^definition\s*\d*:/i.test(line)) {
          const cleaned = line.replace(/^(definition|defined as|principle|concept)\s*\d*:\s*/i, '');
          definitions.push(cleaned);
          items.push({
            type: 'definition',
            title: 'CORE DEFINITION & PRINCIPLE',
            content: cleaned,
            weight: 3
          });
        } else if (/^(example|e\.g\.|worked example|sample problem|practical application):/i.test(line)) {
          const cleaned = line.replace(/^(example|e\.g\.|worked example|sample problem|practical application):\s*/i, '');
          examples.push(cleaned);
          items.push({
            type: 'example',
            title: 'WORKED EXAMPLE & APPLICATION',
            content: cleaned,
            weight: 3
          });
        } else if (/^(formula|equation|math|expression):/i.test(line) || /^[A-Z][a-z0-9_\s]*\s*=\s*[\w\d\s\+\-\*\/\(\)\^\.]+/i.test(line)) {
          const cleaned = line.replace(/^(formula|equation|math|expression):\s*/i, '');
          formulas.push(cleaned);
          items.push({
            type: 'formula',
            title: 'EQUATION & FORMULA BOX',
            content: [cleaned],
            weight: 2
          });
        } else {
          textLines.push(line);
        }
      });

      // Condense long paragraph lines into crisp, high-yield academic bullets
      const condensedBullets = condenseTextToAcademicBullets(textLines.join(' '), 4);

      if (condensedBullets.length > 0 || currentTable.length > 0 || currentTableData.headers.length > 0) {
        const lineUnits = Math.ceil(condensedBullets.length * 0.9);
        const tableUnits = currentTableData.rows.length > 0 ? (2 + currentTableData.rows.length * 0.7) : (currentTable.length > 0 ? (2 + currentTable.length * 0.7) : 0);
        
        items.unshift({
          type: 'concept',
          title: cleanMarkdownText(currentTitle) || 'Key Concepts',
          content: condensedBullets,
          table: currentTable.length > 0 ? [...currentTable] : undefined,
          tableData: currentTableData.headers.length > 0 ? { headers: [...currentTableData.headers], rows: [...currentTableData.rows] } : undefined,
          weight: Math.max(2.5, lineUnits + tableUnits)
        });
      }

      sections.push({
        title: cleanMarkdownText(currentTitle) || 'Key Concept Section',
        items
      });

      currentTitle = '';
      currentContentLines = [];
      currentTable = [];
      currentTableData = { headers: [], rows: [] };
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# ') && !title) {
      title = cleanMarkdownText(line);
      continue;
    }

    if (line.startsWith('## ') || line.startsWith('### ')) {
      const h2Text = line.replace(/^#{2,3}\s+/, '').trim();

      if (/brief overview|overview|introduction/i.test(h2Text)) {
        flushSection();
        let j = i + 1;
        let ovText = '';
        while (j < lines.length && !lines[j].trim().startsWith('#')) {
          ovText += lines[j].trim() + ' ';
          j++;
        }
        overview = cleanMarkdownText(ovText);
        i = j - 1;
        continue;
      }

      if (/remember/i.test(h2Text)) {
        flushSection();
        let j = i + 1;
        let remText = '';
        while (j < lines.length && !lines[j].trim().startsWith('#')) {
          remText += lines[j].trim() + ' ';
          j++;
        }
        remember = cleanMarkdownText(remText);
        i = j - 1;
        continue;
      }

      if (/exam focus|exam/i.test(h2Text)) {
        flushSection();
        let j = i + 1;
        let efText = '';
        while (j < lines.length && !lines[j].trim().startsWith('#')) {
          efText += lines[j].trim() + ' ';
          j++;
        }
        examFocus = cleanMarkdownText(efText);
        i = j - 1;
        continue;
      }

      if (/key points/i.test(h2Text)) {
        flushSection();
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('#')) {
          const kpLine = lines[j].trim();
          if (kpLine.startsWith('- ') || kpLine.startsWith('* ') || /^\d+\.\s+/.test(kpLine)) {
            keyPoints.push(cleanMarkdownText(kpLine.replace(/^([-*]|\d+\.)\s+/, '')));
          }
          j++;
        }
        i = j - 1;
        continue;
      }

      flushSection();
      currentTitle = h2Text;
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) continue;
      const cells = line.split('|').map(c => cleanMarkdownText(c)).map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        if (!currentTableData.headers.length) {
          currentTableData.headers = cells;
        } else {
          currentTableData.rows.push(cells);
        }
        currentTable.push({ col1: cells[0], col2: cells[1] });
      }
      continue;
    }

    currentContentLines.push(line);
  }

  flushSection();

  return { title, overview, keyPoints, sections, remember, examFocus, formulas, definitions, examples };
}

export const HandwrittenNotesViewer: React.FC<HandwrittenNotesViewerProps> = ({
  lectureData,
  theme = 'light',
  isCompiling = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const isCompilingState = 
    isCompiling ||
    !lectureData ||
    lectureData?.isGeneratingNotes ||
    lectureData?.isGeneratingSummary ||
    lectureData?.isGenerating ||
    lectureData?.isCompiling ||
    lectureData?.isProcessing ||
    lectureData?.resourceGenerationStatus === 'processing' ||
    lectureData?.resourceGenerationStatus === 'generating' ||
    lectureData?.resourceGenerationStatus === 'transcribing' ||
    lectureData?.resourceGenerationStatus === 'queued' ||
    lectureData?.status === 'uploading' ||
    lectureData?.status === 'extracting' ||
    lectureData?.status === 'transcribing' ||
    lectureData?.status === 'analyzing' ||
    lectureData?.status === 'generating' ||
    lectureData?.status === 'processing';

  const [formattedOverrideText, setFormattedOverrideText] = useState<string | null>(null);
  const [isFormattingAI, setIsFormattingAI] = useState<boolean>(false);

  const rawNotesString =
    notesToMarkdown(lectureData?.notes, lectureData?.title || 'Lecture Study Notes') ||
    lectureData?.notes?.academic ||
    lectureData?.notes?.quick ||
    lectureData?.notes?.detailed ||
    (typeof lectureData?.notes === 'string' ? lectureData.notes : '') ||
    (typeof lectureData?.content === 'string' ? lectureData.content : '') ||
    (typeof lectureData?.cleanTranscript === 'string' ? lectureData.cleanTranscript : '') ||
    (typeof lectureData?.transcript === 'string' ? lectureData.transcript : '') ||
    '';

  const activeRawNotes = formattedOverrideText || rawNotesString;

  const parsedMarkdown = React.useMemo(() => {
    return parseMarkdownToHandwrittenSections(activeRawNotes);
  }, [activeRawNotes]);

  const handleAIFormatClick = async () => {
    setIsFormattingAI(true);
    try {
      const res = await formatNotesWithAI(activeRawNotes);
      if (res && res !== activeRawNotes) {
        setFormattedOverrideText(res);
      }
    } catch (e) {
      console.warn('AI format error:', e);
    } finally {
      setIsFormattingAI(false);
    }
  };

  const title = cleanMarkdownText(parsedMarkdown.title || lectureData?.title || 'Lecture Study Notes');
  const overview = cleanMarkdownText(parsedMarkdown.overview || lectureData?.summary || lectureData?.notes?.overview || '');

  let sections: HandwrittenSectionData[] = [];
  if (parsedMarkdown.sections.length > 0) {
    sections = parsedMarkdown.sections;
  } else if (Array.isArray(lectureData?.sections) && lectureData.sections.length > 0) {
    sections = lectureData.sections.map((s: any) => {
      const text = cleanMarkdownText(s.content || s.explanation || s.summary || '');
      const bullets = condenseTextToAcademicBullets(text, 4);
      return {
        title: cleanMarkdownText(s.title || s.heading || 'Topic Section'),
        items: [{
          type: 'concept' as const,
          title: cleanMarkdownText(s.title || s.heading || 'Topic Section'),
          content: bullets.length > 0 ? bullets : [text].filter(Boolean),
          weight: Math.max(2.5, Math.ceil(bullets.length * 0.9))
        }]
      };
    });
  } else if (overview) {
    const overviewBullets = condenseTextToAcademicBullets(overview, 3);
    sections = [{
      title: 'Overview & Foundations',
      items: [{
        type: 'concept' as const,
        title: 'Overview & Foundations',
        content: overviewBullets.length > 0 ? overviewBullets : [overview],
        weight: 3
      }]
    }];
  }

  const sourceIntel = lectureData?.sourceIntelligence || {};
  const keyTerms: string[] = (sourceIntel.keyTerms || []).map(cleanMarkdownText);
  const formulas: string[] = [
    ...(sourceIntel.formulas || []).map(cleanMarkdownText),
    ...parsedMarkdown.formulas
  ];
  const keyPoints: string[] = (parsedMarkdown.keyPoints || []).map(cleanMarkdownText);

  const hasNotesContent = sections.length > 0 || (overview && overview.trim().length > 0);

  // DYNAMIC A4 PAGE ALLOCATION ALGORITHM BASED ON TOPIC LENGTH & IMPORTANCE WEIGHT
  const pages = React.useMemo(() => {
    if (!hasNotesContent) return [];

    const noiseRegex = /co-po|course outcome|program outcome|\bco[1-6]\b|\bpo[1-6]\b|table of content|\bindex\b|syllabus|faculty|office hour|grading|prerequisites|unit details/i;
    const cleanSections = sections.filter(s => !noiseRegex.test(s.title || ''));

    const allSections = cleanSections.length > 0 ? cleanSections : [
      {
        title: 'Core Concepts & Overview',
        items: [{
          type: 'concept' as const,
          title: 'Core Concepts & Overview',
          content: condenseTextToAcademicBullets(overview || 'High-yield revision sheet compiled from source material.', 3),
          weight: 3
        }]
      }
    ];

    // Total content word count calculation to determine appropriate page count
    const totalWordCount = (overview + ' ' + rawNotesString).split(/\s+/).filter(Boolean).length;

    // Target Max Page Count based strictly on Topic Length & Importance Weight:
    // Short topics (< 400 words): 1 Page Cheat Sheet
    // Medium topics (400 - 1200 words): 2 Pages Study Notes
    // Long topics (> 1200 words): 3 Pages Max
    const maxAllowedPages = totalWordCount < 400 ? 1 : totalWordCount < 1200 ? 2 : 3;

    // Height budget units per A4 page (25 units per page)
    const MAX_PAGE_UNITS = 25;

    // Collect all discrete items to be rendered across pages
    const flattenedItems: HandwrittenItem[] = [];

    // Page 1 Synthesis Box if available
    if (overview && !noiseRegex.test(overview)) {
      const ovBullets = condenseTextToAcademicBullets(overview, 3);
      flattenedItems.push({
        type: 'text',
        title: 'CORE TOPIC SYNTHESIS',
        content: ovBullets.length > 0 ? ovBullets : overview,
        weight: 3
      });
    }

    // Page 1 Key Points if available
    if (keyPoints.length > 0) {
      flattenedItems.push({
        type: 'bullets',
        title: 'KEY REVISION POINTS',
        content: keyPoints.slice(0, 5),
        weight: Math.min(5, 1 + Math.min(5, keyPoints.length) * 0.8)
      });
    }

    // Add all section items
    allSections.forEach(sec => {
      sec.items.forEach(item => {
        flattenedItems.push(item);
      });
    });

    // Prepare supplementary revision callouts
    const supplementaryItems: HandwrittenItem[] = [];

    if (parsedMarkdown.remember) {
      supplementaryItems.push({
        type: 'remember',
        title: 'REMEMBER FOR EXAMS',
        content: parsedMarkdown.remember,
        weight: 3
      });
    }

    if (parsedMarkdown.examFocus) {
      supplementaryItems.push({
        type: 'examFocus',
        title: 'EXAM FOCUS & TIP',
        content: parsedMarkdown.examFocus,
        weight: 3
      });
    }

    if (formulas.length > 0) {
      supplementaryItems.push({
        type: 'formula',
        title: 'KEY FORMULAS & EQUATIONS',
        content: Array.from(new Set(formulas)).slice(0, 5),
        weight: Math.min(5, 1.5 + formulas.length * 1)
      });
    }

    if (keyTerms.length > 0) {
      supplementaryItems.push({
        type: 'terms',
        title: 'KEY TERMINOLOGY',
        content: Array.from(new Set(keyTerms)).slice(0, 8),
        weight: 2.5
      });
    }

    // Bin-pack items into A4 pages
    const pagesResult: Array<{
      pageNumber: number;
      header: string;
      items: HandwrittenItem[];
    }> = [];

    let currentPageItems: HandwrittenItem[] = [];
    let currentUnits = 0;

    const commitPage = () => {
      if (currentPageItems.length === 0) return;
      const pageNum = pagesResult.length + 1;
      const sectionNum = String(pageNum).padStart(2, '0');
      const headerTitle = pageNum === 1
        ? 'CONCEPTUAL FOUNDATIONS'
        : pageNum === 2
          ? 'ADVANCED TOPICS & ARCHITECTURE'
          : 'REVISION & EXAM CHEAT SHEET';

      pagesResult.push({
        pageNumber: pageNum,
        header: `SECTION ${sectionNum} — ${headerTitle}`,
        items: [...currentPageItems]
      });

      currentPageItems = [];
      currentUnits = 0;
    };

    // Item placement loop
    flattenedItems.forEach(item => {
      if (pagesResult.length >= maxAllowedPages && currentPageItems.length > 0) {
        // If max allowed page count reached, fit into existing page budget
        currentPageItems.push(item);
        return;
      }

      const effectiveMaxUnits = (pagesResult.length === 0 && currentPageItems.length === 0)
        ? (MAX_PAGE_UNITS - 4)
        : MAX_PAGE_UNITS;

      if (currentUnits + item.weight > effectiveMaxUnits && currentPageItems.length > 0) {
        if (supplementaryItems.length > 0) {
          const spaceRemaining = effectiveMaxUnits - currentUnits;
          const fitIndex = supplementaryItems.findIndex(supp => supp.weight <= spaceRemaining);
          if (fitIndex !== -1) {
            const [suppItem] = supplementaryItems.splice(fitIndex, 1);
            currentPageItems.push(suppItem);
            currentUnits += suppItem.weight;
          }
        }
        commitPage();
      }

      if (pagesResult.length < maxAllowedPages || pagesResult.length === 0) {
        currentPageItems.push(item);
        currentUnits += item.weight;
      }
    });

    if (pagesResult.length < maxAllowedPages) {
      supplementaryItems.forEach(suppItem => {
        const effectiveMaxUnits = (pagesResult.length === 0 && currentPageItems.length === 0)
          ? (MAX_PAGE_UNITS - 4)
          : MAX_PAGE_UNITS;

        if (currentUnits + suppItem.weight > effectiveMaxUnits && currentPageItems.length > 0) {
          if (pagesResult.length < maxAllowedPages - 1) {
            commitPage();
          }
        }

        currentPageItems.push(suppItem);
        currentUnits += suppItem.weight;
      });
    }

    commitPage();

    // Strictly enforce max page cap corresponding to topic length weight
    return pagesResult.slice(0, maxAllowedPages);
  }, [sections, overview, keyPoints, formulas, keyTerms, hasNotesContent, parsedMarkdown, rawNotesString]);

  const showLoading = (!hasNotesContent || pages.length === 0) && (isCompilingState || !lectureData);

  if (showLoading) {
    return (
      <div className="handwritten-workspace space-y-6 select-none p-6">
        <div className="p-8 rounded-[8px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-md text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#FFC400] border-t-transparent animate-spin" />
            <span className="text-2xl">📝</span>
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-[4px] bg-[#1E3A8A] text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-[#111111] shadow-paper-sm">
              COMPILING A4 REVISION SHEET
            </span>
            <h3 className="text-lg font-heading font-bold text-[#111111] uppercase tracking-tight">
              AI IS COMPILING HANDWRITTEN A4 REVISION NOTES...
            </h3>
            <p className="text-xs font-mono font-bold text-[#475569] max-w-md mx-auto leading-relaxed">
              Synthesizing concise A4 handwritten study sheets, red-line notebook canvas, formulas & terminology. 
              Preview will automatically display when note compilation is 100% complete.
            </p>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden border border-[#111111]">
            <div className="bg-[#2563EB] h-full animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasNotesContent || pages.length === 0) {
    return (
      <div className="handwritten-workspace space-y-6 select-none p-6">
        <div className="p-8 rounded-[8px] border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center space-y-3 max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#E2E8F0] text-[#64748B] mx-auto flex items-center justify-center text-xl font-bold">
            📝
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-bold text-[#334155] uppercase">
              No Handwritten Notes Available Yet
            </h3>
            <p className="text-xs font-mono font-medium text-[#64748B]">
              Handwritten A4 notes have not been compiled for this lecture yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    try {
      if (typeof window !== 'undefined') {
        if ((window as any).AndroidPrint && typeof (window as any).AndroidPrint.printDocument === 'function') {
          (window as any).AndroidPrint.printDocument(title || "NoteIT_Handwritten_Notes");
        } else {
          window.print();
        }
      }
    } catch (err) {
      console.warn('Print exception:', err);
      try { window.print(); } catch (_) {}
    }
  };

  return (
    <div className="handwritten-workspace space-y-6 select-text">
      {/* TOOLBAR CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-[4px] bg-[#1E3A8A] text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-[#111111] shadow-paper-sm">
            📝 A4 REVISION SHEET ({pages.length} {pages.length === 1 ? 'PAGE' : 'PAGES'})
          </span>
          <span className="text-xs font-mono font-bold text-[#666666]">
            (210mm × 297mm Standard A4 Notebook)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAIFormatClick}
            disabled={isFormattingAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC400] text-[#111111] text-xs font-mono font-bold uppercase rounded-[4px] border border-[#111111] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer transition-all disabled:opacity-50"
            title="Use AI to automatically re-structure messy notes into clean textbook Markdown and convert comparison lists into proper tables"
          >
            {isFormattingAI ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
                <span>FORMATTING...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#111111] fill-[#111111]" />
                <span>✨ AUTO-FORMAT WITH AI (FIX TABLES)</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFC400] text-[#111111] text-xs font-mono font-bold uppercase rounded-[4px] border border-[#111111] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>DOWNLOAD / PRINT A4 PDF</span>
          </button>
        </div>
      </div>

      {/* HANDWRITTEN QUALITY + PRINT/PDF-SPECIFIC CSS */}
      <style>{`
        .a4-page {
          font-family: 'Kalam', 'Caveat', 'Patrick Hand', 'Segoe Print', 'Comic Sans MS', cursive !important;
          font-synthesis: none !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          letter-spacing: 0.015em;
        }
        .a4-page p,
        .a4-page li,
        .a4-page td,
        .a4-page th {
          line-height: 28px !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #FFFFFF !important;
          }
          body * {
            visibility: hidden;
          }
          .handwritten-a4-stack, .handwritten-a4-stack * {
            visibility: visible;
          }
          .handwritten-a4-stack {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .handwritten-a4-stack > * + * {
            margin-top: 0 !important;
          }
          .a4-page {
            page-break-after: always;
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
          .a4-page:last-child {
            page-break-after: auto !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* VERTICALLY SCROLLABLE A4 PAGES STACK */}
      <div ref={containerRef} className="handwritten-a4-stack space-y-10 flex flex-col items-center py-6 bg-[#0F172A] rounded-[8px] p-6 border-2 border-[#111111] overflow-x-auto">
        {pages.map((pg) => (
          <div
            key={pg.pageNumber}
            className="a4-page relative w-[210mm] min-h-[297mm] !bg-white !text-slate-900 pt-[16mm] pb-[16mm] pr-[16mm] pl-[26mm] rounded-[3px] border-2 border-slate-300 shadow-2xl font-handwritten select-text flex flex-col justify-between overflow-hidden"
            style={{
              fontFamily: "'Kalam', 'Caveat', 'Patrick Hand', 'Segoe Print', 'Comic Sans MS', cursive",
              backgroundColor: '#FFFFFF',
              backgroundImage: 'linear-gradient(#FFFFFF 27px, #CBD5E1 28px)',
              backgroundSize: '100% 28px',
              lineHeight: '28px',
              color: '#0F294A'
            }}
          >
            {/* ICONIC RED NOTEBOOK MARGIN LINE */}
            <div className="absolute top-0 bottom-0 left-[20mm] w-[1.5px] bg-red-400 opacity-85 z-10 pointer-events-none" />

            {/* RING BINDER HOLE PUNCH MARKS */}
            <div className="absolute top-[35mm] left-[8mm] w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner z-10 pointer-events-none" />
            <div className="absolute top-[148mm] left-[8mm] w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner z-10 pointer-events-none" />
            <div className="absolute top-[260mm] left-[8mm] w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner z-10 pointer-events-none" />

            <div>
              {/* TOP NOTEBOOK HEADER BOX */}
              <div className="flex justify-between items-center pb-2 border-b-2 border-[#2563EB] mb-5 text-sm font-bold tracking-wide">
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-[#2563EB]" />
                  <span className="text-[#0F294A] uppercase tracking-wider text-xs font-mono font-bold">{pg.header}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono font-bold text-[#475569]">
                  <span>DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="px-2 py-0.5 rounded bg-[#2563EB] text-white text-[10px]">
                    PAGE {String(pg.pageNumber).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* DOCUMENT TITLE BANNER (PAGE 1) */}
              {pg.pageNumber === 1 && (
                <div className="mb-6 pb-3 border-b-2 border-slate-300">
                  <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#0F294A] leading-tight mb-2 decoration-wavy underline underline-offset-8">
                    {title}
                  </h1>
                  <div className="text-xs font-mono font-bold text-[#334155] mt-2 italic flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                    <span>Academic Lecture Notes • A4 Student Notebook Sheet</span>
                  </div>
                </div>
              )}

              {/* PAGE SECTION CONTENT */}
              <div className="space-y-6 text-base leading-relaxed text-[#0F294A]">
                {pg.items.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* SECTION TITLE HIGHLIGHTER BADGE */}
                    {item.title && (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#FFD54F] text-[#0F294A] text-lg font-bold shadow-sm border border-amber-400 inline-block">
                          ✏ {item.title}
                        </span>
                      </div>
                    )}

                    {/* TEXT / CONCEPT ITEMS */}
                    {(item.type === 'text' || item.type === 'concept') && (
                      <div className="pl-2 space-y-2 text-lg font-bold leading-[28px] text-[#0F294A]">
                        {Array.isArray(item.content) ? (
                          item.content.map((pLine: string, pIdx: number) => (
                            <p key={pIdx} className="leading-[28px]">
                              {pLine.startsWith('- ') || pLine.startsWith('* ') ? (
                                <span className="flex items-start gap-2">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{pLine.replace(/^[-*]\s+/, '')}</span>
                                </span>
                              ) : /^\d+\.\s+/.test(pLine) ? (
                                <span className="flex items-start gap-2">
                                  <span className="text-[#2563EB] font-bold">{pLine.match(/^\d+\./)?.[0]}</span>
                                  <span>{pLine.replace(/^\d+\.\s+/, '')}</span>
                                </span>
                              ) : (
                                <span className="flex items-start gap-2">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{pLine}</span>
                                </span>
                              )}
                            </p>
                          ))
                        ) : (
                          <p className="whitespace-pre-line leading-[28px]">{item.content}</p>
                        )}

                        {/* HANDWRITTEN COMPARISON TABLE */}
                        {(item.tableData?.headers?.length || (item.table && item.table.length > 0)) && (
                          <div className="my-4 overflow-x-auto rounded-[6px] border-2 border-[#2563EB] bg-[#FAF8F5] p-3 shadow-sm font-sans">
                            <div className="text-xs font-mono font-bold uppercase text-[#2563EB] mb-2 flex items-center gap-1.5">
                              <span>📊 Structured Reference Table</span>
                            </div>
                            <table className="w-full text-left border-collapse text-sm font-sans font-bold">
                              <thead>
                                <tr className="border-b-2 border-[#2563EB] bg-[#E2E8F0] text-[#0F294A]">
                                  {(item.tableData?.headers || [item.table?.[0]?.col1 || 'Concept', item.table?.[0]?.col2 || 'Value']).map((head: string, hIdx: number) => (
                                    <th key={hIdx} className="p-2 border-r border-[#CBD5E1] font-mono font-extrabold uppercase text-xs last:border-r-0">
                                      {head}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {item.tableData ? (
                                  item.tableData.rows.map((rowArr: string[], rIdx: number) => (
                                    <tr key={rIdx} className="border-b border-[#CBD5E1] last:border-b-0 hover:bg-[#F1F5F9]">
                                      {rowArr.map((cell: string, cIdx: number) => (
                                        <td key={cIdx} className="p-2 border-r border-[#CBD5E1] font-medium text-xs text-[#0F294A] last:border-r-0">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                ) : (
                                  item.table.slice(1).map((row: any, rIdx: number) => (
                                    <tr key={rIdx} className="border-b border-[#CBD5E1] last:border-b-0 hover:bg-[#F1F5F9]">
                                      <td className="p-2 border-r border-[#CBD5E1] font-bold text-[#1E293B]">{row.col1}</td>
                                      <td className="p-2 font-bold text-[#0F294A]">{row.col2}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DEFINITION CARD */}
                    {item.type === 'definition' && (
                      <div className="my-3 p-4 rounded-[6px] border-2 border-emerald-500 bg-[#ECFDF5] text-[#065F46] shadow-sm space-y-1">
                        <div className="text-xs font-mono font-bold uppercase text-emerald-800 tracking-wider">⚡ DEFINITION & PRINCIPLE</div>
                        <p className="text-lg font-bold leading-[28px]">{item.content}</p>
                      </div>
                    )}

                    {/* WORKED EXAMPLE CARD */}
                    {item.type === 'example' && (
                      <div className="my-3 p-4 rounded-[6px] border-2 border-amber-500 bg-[#FFFBEB] text-[#92400E] shadow-sm space-y-1">
                        <div className="text-xs font-mono font-bold uppercase text-amber-900 tracking-wider">💡 WORKED EXAMPLE & APPLICATION</div>
                        <p className="text-lg font-bold leading-[28px]">{item.content}</p>
                      </div>
                    )}

                    {/* REMEMBER STICKY NOTE */}
                    {item.type === 'remember' && (
                      <div className="my-3 p-4 rounded-[6px] border-2 border-amber-400 bg-[#FEF3C7] text-[#78350F] shadow-sm space-y-1">
                        <div className="text-xs font-mono font-bold uppercase text-amber-800 tracking-wider">📌 REMEMBER FOR EXAMS</div>
                        <p className="text-lg font-bold leading-[28px]">{item.content}</p>
                      </div>
                    )}

                    {/* EXAM FOCUS CARD */}
                    {item.type === 'examFocus' && (
                      <div className="my-3 p-4 rounded-[6px] border-2 border-blue-400 bg-[#EFF6FF] text-[#1E3A8A] shadow-sm space-y-1">
                        <div className="text-xs font-mono font-bold uppercase text-blue-800 tracking-wider">🎯 EXAM FOCUS & HIGH-YIELD TIP</div>
                        <p className="text-lg font-bold leading-[28px]">{item.content}</p>
                      </div>
                    )}

                    {/* DIAGRAM FLOW CARD */}
                    {item.type === 'diagram' && (
                      <div className="my-3 p-4 rounded-[6px] border-2 border-dashed border-[#2563EB] bg-[#F8FAFC]">
                        <div className="text-xs font-bold uppercase text-[#2563EB] mb-2 font-mono">Process Flow Diagram</div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                          {Array.isArray(item.content) && item.content.map((step: string, sIdx: number) => (
                            <React.Fragment key={sIdx}>
                              <div 
                                className="p-2.5 bg-white rounded-md border-2 border-[#2563EB] shadow-sm font-bold text-sm flex-1 text-center"
                                style={{ backgroundColor: '#FFFFFF', color: '#0F294A' }}
                              >
                                {step}
                              </div>
                              {sIdx < item.content.length - 1 && (
                                <ArrowRight className="h-5 w-5 text-[#2563EB] shrink-0 sm:rotate-0 rotate-90" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EQUATION / FORMULA BOX */}
                    {item.type === 'formula' && (
                      <div className="my-3 space-y-2">
                        {Array.isArray(item.content) && item.content.map((f: string, fIdx: number) => (
                          <div key={fIdx} className="p-3 rounded-[6px] border-2 border-[#2563EB] bg-[#F1F5F9] shadow-sm relative">
                            <span className="absolute top-1 right-2 text-[10px] font-mono text-blue-700 uppercase font-bold">📐 Equation Box</span>
                            <div className="text-xl font-bold text-[#0F294A] tracking-wider font-mono">
                              {f}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TERMINOLOGY TAGS */}
                    {item.type === 'terms' && (
                      <div className="flex flex-wrap gap-2 my-2 pl-2">
                        {Array.isArray(item.content) && item.content.map((term: string, tIdx: number) => (
                          <span key={tIdx} className="px-3 py-1 bg-amber-100 rounded-full border border-amber-400 text-amber-950 font-bold text-sm">
                            🏷 {term}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* BULLET POINTS */}
                    {item.type === 'bullets' && (
                      <ul className="space-y-1.5 pl-2 text-lg">
                        {Array.isArray(item.content) && item.content.map((bullet: string, bIdx: number) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span className="font-bold text-[#0F294A] leading-[28px]">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PAGE FOOTER */}
            <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-xs font-mono font-bold text-slate-600">
              <span>NOTEIT — HANDWRITTEN A4 REVISION ENGINE</span>
              <span>STANDARD A4 PORTRAIT (210mm × 297mm) • PAGE {pg.pageNumber} OF {pages.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
