/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Sparkles, Check, AlertTriangle, HelpCircle, Layers, Lightbulb, Target, Flame, ExternalLink } from 'lucide-react';
import { ensureGfgTagsInMarkdown, formatNotesWithAI } from '../../services/gemini';

interface AcademicNotesViewerProps {
  content: string | Record<string, string> | any[];
  mode?: string;
  theme?: 'light' | 'dark';
  isCompiling?: boolean;
}

/**
 * Strips timestamp, source tags, slide numbering (e.g. SLIDE 3 / 10),
 * university boilerplate (e.g. Chandigarh University), and syllabus metadata noise
 * to produce clean, textbook-quality notes without visual clutter.
 */
export function cleanAcademicNotesNoise(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. Remove slide header/footer markers, SLIDE numbers, university branding, and timestamp noise
  cleaned = cleaned
    .replace(/(Learning Objectives|Learning Outcomes|Lecture|Course Outcomes|Course Outcome)?\s*SLIDE\s*\d+\s*\/\s*\d+\s*(Chandigarh University|\w+\s+University)?\s*\d*\s*\/?\s*\d*/gi, '')
    .replace(/(Chandigarh University|\b[A-Z][a-z]+\s+University)\s*\d*\s*\/?\s*\d*/gi, '')
    .replace(/SLIDE\s*\d+\s*\/\s*\d+/gi, '')
    .replace(/SLIDE\s*\d+/gi, '')
    .replace(/\[Source:\s*Timestamp\s*\d{1,2}:\d{2}\]/gi, '')
    .replace(/\[Source:\s*Page\s*\d+\]/gi, '')
    .replace(/\[Source:\s*[^\]]+\]/gi, '')
    .replace(/Source:\s*media\.geeksforgeeks\.org/gi, '')
    .replace(/Source:\s*https?:\/\/[^\s]+/gi, '')
    .replace(/\[\d{1,2}:\d{2}\]/g, '');

  // 2. Remove Course Outcomes / BT Level syllabus mapping boilerplate tables (e.g. CO1 BT3, CO2 BT4, BT LEVEL DESCRIPTION...)
  cleaned = cleaned.replace(/Course Outcomes?\s*SLIDE.*?(?=\n\n|By the end|In this session|Let's look|##|#|$)/gis, '');
  cleaned = cleaned.replace(/Course Outcomes?.*?BT LEVEL.*?DESCRIPTION.*?(?=(By the end|In this session|Let's look|##|\n\n|$))/gis, '');
  cleaned = cleaned.replace(/(\bCO[1-6]\b|\bBT[1-6]\b|\bBT LEVEL\b|\bCourse OutcomeCO\b|\bDESCRIPTION CO[1-6]\b|\bBT LEVEL DESCRIPTION\b)[^\n]*/gi, '');

  // 3. Fix OCR concatenated words/numbers without spaces (e.g., "1Define" -> "1. Define", "2Analyze" -> "2. Analyze", "Definition1Logic" -> "Definition 1 Logic")
  cleaned = cleaned
    .replace(/(\b[A-Za-z]+)(\d+)([A-Z][a-z]+)/g, '$1 $2 $3')
    .replace(/(Definition|Equation|Example|Overview|Outcome|Objective)(\d+)/gi, '$1 $2')
    .replace(/(^\s*|\n)(\d+)([A-Z][a-z]{2,})/g, '$1$2. $3')
    .replace(/([a-z])([A-Z][a-z]{3,})/g, '$1. $2')
    .replace(/([a-z])(SLIDE|GOVERNING|OPERATION|DEFINITION)/gi, '$1 $2');

  // 4. Clean multiple spaces and blank lines
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

/** Legacy alias for backward compatibility */
export const cleanNotesTimestamps = cleanAcademicNotesNoise;

/**
 * Detects vertical pseudo-table lists (e.g. Header line followed by option names, then repeated 3-tuples)
 * and automatically converts them into GitHub-Flavored Markdown tables (| Feature | RISC | CISC |).
 */
export function detectAndConvertVerticalTables(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const rawLines = text.split(/\r?\n/);
  const outputLines: string[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    const isFeatureHeader = /^(Feature|Parameter|Property|Comparison|Aspect|Metric|Criteria|Specification|Attribute|Item|Category)s?\b/i.test(line)
      || /^#{1,3}\s*(Feature|Parameter|Property|Comparison|Aspect|Metric)s?/i.test(line);

    if (isFeatureHeader && i + 2 < rawLines.length) {
      const col0 = line.replace(/^#{1,6}\s+/, '').replace(/:$/, '').trim();

      const colItems: string[] = [];
      let j = i + 1;

      while (j < rawLines.length && colItems.length < 4) {
        const nextLine = rawLines[j].trim();
        if (!nextLine) break;
        if (/^#{1,3}\s+/.test(nextLine)) break;

        const cleanItem = nextLine.replace(/^[*\-•▪]\s+/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
        if (cleanItem.length > 0 && cleanItem.length < 60) {
          colItems.push(cleanItem);
          j++;
        } else {
          break;
        }
      }

      if (colItems.length >= 2 && colItems.length <= 4) {
        const numCols = colItems.length;
        const headers = [col0, ...colItems];
        const tableRows: string[][] = [];

        let rowPtr = j;
        while (rowPtr < rawLines.length) {
          while (rowPtr < rawLines.length && !rawLines[rowPtr].trim()) rowPtr++;
          if (rowPtr >= rawLines.length) break;

          const rowLabelLine = rawLines[rowPtr].trim();
          if (/^#{1,3}\s+/.test(rowLabelLine) || rowLabelLine.startsWith('|')) break;

          const rowLabel = rowLabelLine.replace(/^[*\-•▪]\s+/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
          if (!rowLabel || rowLabel.length > 100) break;

          const rowValues: string[] = [];
          let valPtr = rowPtr + 1;

          while (valPtr < rawLines.length && rowValues.length < numCols) {
            const valLine = rawLines[valPtr].trim();
            if (!valLine) {
              valPtr++;
              continue;
            }
            if (/^#{1,3}\s+/.test(valLine) || valLine.startsWith('|')) break;

            const cleanVal = valLine.replace(/^[*\-•▪]\s+/, '').trim();
            rowValues.push(cleanVal);
            valPtr++;
          }

          if (rowValues.length === numCols) {
            tableRows.push([rowLabel, ...rowValues]);
            rowPtr = valPtr;
          } else {
            break;
          }
        }

        if (tableRows.length >= 2) {
          outputLines.push(`| ${headers.join(' | ')} |`);
          outputLines.push(`| ${headers.map(() => ':---').join(' | ')} |`);
          tableRows.forEach(row => {
            outputLines.push(`| ${row.join(' | ')} |`);
          });

          i = rowPtr;
          continue;
        }
      }
    }

    outputLines.push(rawLines[i]);
    i++;
  }

  return outputLines.join('\n');
}

/**
 * Automatically structures raw un-synthesized document text or transcripts
 * into clean, textbook-grade academic sections with headers, bold labels, and bullet points.
 */
export function autoStructureRawText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text.replace(/\r\n/g, '\n').trim();

  // Strip leading file name noise e.g. "Class Content Unit 2.docx Unit 2 "
  cleaned = cleaned.replace(/^(Class Content |Document |File |Unit \d+[\.a-z0-9_\-\s]*)+/i, '');

  // 0. Convert vertical pseudo-tables into Markdown tables
  cleaned = detectAndConvertVerticalTables(cleaned);

  // 1. Separate concatenated topic headers into distinct lines
  cleaned = cleaned
    .replace(/([.!?\)]|\b)\s*([A-Z][A-Za-z0-9\s\&\-\(\)\/]{3,50})(:\s*|[-—–]\s*)/g, (match, prefix, title, sep) => {
      const t = title.trim();
      if (
        /^(Main Parts|Core Components|Key Concepts|Register Transfer|Conditional Register|Micro Operations|Types of Micro|Arithmetic Micro|Logic Micro|Shift Micro|Register Transfer Language|RTL|Basic Symbols|Naming Operator|Simple Transfer|Conditional Transfer|Simultaneous Operations|Bus and [A-Za-z]+|Common Bus|Multiplexers|Tri-state|Memory Unit|Control Unit|Central Processing|ALU|CPU|CU|RAM|ROM|Overview|Introduction|Definition|Key Concept|Formula|Equation|Example)/i.test(t)
      ) {
        return `${prefix}\n\n### ${t}\n`;
      }
      return match;
    });

  // 2. If text already has full Markdown headers and multiple bullet points or tables, return cleaned version
  const headerCount = (cleaned.match(/^#{1,3}\s+/gm) || []).length;
  const bulletCount = (cleaned.match(/^\s*[\*\-\•▪]\s+/gm) || []).length;
  const tableCount = (cleaned.match(/^\|[^\n]+\|/gm) || []).length;

  if (headerCount >= 2 && (bulletCount >= 3 || tableCount >= 2)) {
    return cleaned;
  }

  // 3. Process lines to format key-value pairs, bullet points, and subheadings
  const rawLines = cleaned.split('\n');
  const structuredLines: string[] = [];

  // Add H1 if not already present
  if (!/^#\s+/m.test(cleaned)) {
    structuredLines.push(`# Structured Academic Study Notes`);
  }

  for (let line of rawLines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('|')) {
      structuredLines.push(trimmed);
      continue;
    }

    // Existing Markdown headers
    if (/^#{1,3}\s+/.test(trimmed)) {
      structuredLines.push(`\n${trimmed}\n`);
      continue;
    }

    // Existing bullet points
    if (/^[\*\-\•▪]\s+/.test(trimmed)) {
      structuredLines.push(trimmed.replace(/^[\*\-\•▪]\s+/, '* '));
      continue;
    }

    // Process inline sentences or definition pairs inside the line
    const segments = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/);
    for (let segment of segments) {
      const segTrimmed = segment.trim();
      if (!segTrimmed) continue;

      if (segTrimmed.includes(':') && !segTrimmed.toLowerCase().startsWith('http')) {
        const colonIdx = segTrimmed.indexOf(':');
        const label = segTrimmed.substring(0, colonIdx).trim().replace(/\[gfg\]/gi, '');
        const body = segTrimmed.substring(colonIdx + 1).trim();

        if (label.length >= 2 && label.length <= 60 && !label.includes('.')) {
          structuredLines.push(`* **${label}**: ${body}`);
          continue;
        }
      }

      if (segTrimmed.length < 65 && /^[A-Z0-9\s\-\(\)\/\.,]+$/.test(segTrimmed) && !segTrimmed.endsWith('.')) {
        structuredLines.push(`\n### ${segTrimmed}\n`);
        continue;
      }

      structuredLines.push(segTrimmed);
    }
  }

  // Group markdown table lines without inserting double newlines between them
  const joinedBlocks: string[] = [];
  for (let idx = 0; idx < structuredLines.length; idx++) {
    const curr = structuredLines[idx];
    const prev = idx > 0 ? structuredLines[idx - 1] : '';

    if (curr.startsWith('|') && prev.startsWith('|')) {
      joinedBlocks.push('\n' + curr);
    } else {
      if (idx > 0) joinedBlocks.push('\n\n');
      joinedBlocks.push(curr);
    }
  }

  return joinedBlocks.join('').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Render Markdown content cleanly with Bauhaus aesthetics,
 * properly formatted headings, tables, callouts, formulas, and bullet points.
 */
export const AcademicNotesViewer: React.FC<AcademicNotesViewerProps> = ({
  content,
  mode = 'academic',
  theme = 'light',
  isCompiling = false
}) => {
  const [formattedOverrideText, setFormattedOverrideText] = React.useState<string | null>(null);
  const [isFormattingAI, setIsFormattingAI] = React.useState<boolean>(false);

  if (isCompiling) {
    return (
      <div className="p-8 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] shadow-paper-sm text-center space-y-4 my-6 font-sans">
        <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#FFC400] border-t-transparent animate-spin" />
          <BookOpen className="h-6 w-6 text-[var(--text-primary)]" />
        </div>
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded bg-[#FFC400] text-[#111111] text-xs font-mono font-extrabold uppercase border border-[#111111]">
            COMPILING STUDY NOTES
          </span>
          <h4 className="text-base font-heading font-extrabold text-[var(--text-primary)] uppercase">
            Formatting Academic Notes & Structure...
          </h4>
          <p className="text-xs font-mono font-bold text-[var(--text-secondary)]">
            Full textbook notes are being processed. Preview will load automatically when complete.
          </p>
        </div>
      </div>
    );
  }

  // Normalize content into a single clean string
  let rawText = '';
  if (typeof content === 'string') {
    rawText = content;
  } else if (Array.isArray(content)) {
    rawText = content.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const t = item.title ? `# ${item.title}\n` : '';
        const c = item.content || item.text || item.explanation || '';
        return `${t}${c}`;
      }
      return '';
    }).filter(Boolean).join('\n\n---\n\n');
  } else if (content && typeof content === 'object') {
    rawText = content[mode] || content.academic || content.detailed || content.quick || Object.values(content)[0] || '';
  }

  const activeRawText = formattedOverrideText || rawText;
  const structuredText = autoStructureRawText(cleanAcademicNotesNoise(activeRawText));
  const cleanedText = ensureGfgTagsInMarkdown(structuredText);

  const handleAIFormatClick = async () => {
    setIsFormattingAI(true);
    try {
      const res = await formatNotesWithAI(activeRawText);
      if (res && res !== activeRawText) {
        setFormattedOverrideText(res);
      }
    } catch (e) {
      console.warn('AI format error:', e);
    } finally {
      setIsFormattingAI(false);
    }
  };


  if (!cleanedText.trim()) {
    return (
      <div className="text-center py-12 border border-dashed border-[#111111] rounded-[6px] bg-white p-6 space-y-3 font-sans">
        <BookOpen className="h-8 w-8 text-[#666666] mx-auto animate-pulse" />
        <p className="text-sm font-mono font-bold text-[#666666]">No study notes available for this section.</p>
      </div>
    );
  }

  // Parse lines to build structured academic layout
  const lines = cleanedText.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTableRows: string[][] = [];
  let isInsideTable = false;
  let keyCounter = 0;

  const renderFormattedInlineText = (text: string) => {
    // Process markdown links [Text](url), inline bold **Text**, code/math `code` or $math$
    let formatted: React.ReactNode[] = [];
    const parts = text.split(/(\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);

    parts.forEach((part, idx) => {
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
        if (linkMatch) {
          const linkText = linkMatch[1];
          const linkHref = linkMatch[2].trim();

          const lowerHref = linkHref.toLowerCase();
          const isGfgLink = lowerHref === 'gfg' || lowerHref.startsWith('gfg:') || lowerHref.startsWith('gfg_') || lowerHref.includes('geeksforgeeks');

          if (isGfgLink) {
            let gfgUrl = '';
            let cleanQuery = linkText;

            const urlMatch = linkHref.match(/https?:\/\/[^\s\)]+/i);
            if (urlMatch) {
              gfgUrl = urlMatch[0];
            } else {
              const queryTerm = linkHref.includes(':') ? linkHref.substring(linkHref.indexOf(':') + 1) : linkText;
              cleanQuery = (queryTerm || linkText).trim().replace(/^(gfg:?|geeksforgeeks:?)/i, '').trim();
              gfgUrl = cleanQuery
                ? `https://www.geeksforgeeks.org/search/?gq=${encodeURIComponent(cleanQuery)}`
                : 'https://www.geeksforgeeks.org';
            }

            formatted.push(
              <a
                key={idx}
                href={gfgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#2F8D46] dark:text-[#4ADE80] hover:underline bg-[#2F8D46]/10 px-1.5 py-0.5 rounded text-xs font-sans no-underline transition-colors mx-0.5 cursor-pointer group"
                title={urlMatch ? `Open "${linkText}" on GeeksforGeeks` : `Look up "${cleanQuery}" on GeeksforGeeks`}
              >
                <span>{linkText}</span>
                <span className="text-[10px] font-mono font-bold bg-[#2F8D46] text-white px-1 rounded group-hover:bg-[#257338] transition-colors flex items-center gap-0.5">
                  GFG ↗
                </span>
              </a>
            );
          } else {
            formatted.push(
              <a
                key={idx}
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 font-sans"
              >
                {linkText}
              </a>
            );
          }
          return;
        }
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        // Highlight specific labels like Definition:, Given:, Result:, Formula: or [HIGH WEIGHTAGE]
        if (/^(\[?🔥\s*HIGH WEIGHTAGE\]?|\[?⭐\s*EXAM PRIORITY\]?|HIGH WEIGHTAGE|EXAM PRIORITY)/i.test(inner)) {
          formatted.push(
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FF4D4D] text-white font-mono font-extrabold text-xs uppercase border border-[#111111] shadow-paper-sm mr-1 my-0.5">
              🔥 HIGH WEIGHTAGE
            </span>
          );
        } else if (/^(Definition|Key Idea|Important|Formula|Given|Process|Result|Example|Where|Common Confusion):/i.test(inner)) {
          formatted.push(
            <span key={idx} className="inline-block px-1.5 py-0.5 rounded-[3px] bg-[#FFC400] text-[#111111] font-mono font-extrabold text-xs uppercase tracking-wide mr-1 border border-[#111111] shadow-paper-sm">
              {inner}
            </span>
          );
        } else {
          formatted.push(
            <strong key={idx} className="font-extrabold text-[#111111] dark:text-white font-sans">
              {inner}
            </strong>
          );
        }
      } else if ((part.startsWith('`') && part.endsWith('`')) || (part.startsWith('$') && part.endsWith('$'))) {
        const inner = part.slice(1, -1);
        formatted.push(
          <code key={idx} className="px-1.5 py-0.5 rounded-[3px] bg-[var(--panel-bg)] text-[#111111] dark:text-gray-100 font-mono text-xs font-bold border border-[var(--border-main)] mx-0.5">
            {inner}
          </code>
        );
      } else {
        formatted.push(part);
      }
    });

    return formatted;
  };

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      const headerRow = currentTableRows[0];
      const dataRows = currentTableRows.slice(1).filter(r => !r.every(c => c.replace(/[-:\s]/g, '') === ''));

      elements.push(
        <div key={`table-${keyCounter++}`} className="my-5 overflow-x-auto rounded-[6px] border border-[#111111] bg-white text-[#111111] shadow-paper-sm font-sans">
          <table className="w-full text-left font-sans text-sm border-collapse">
            <thead>
              <tr className="bg-[#FFC400] text-[#111111] border-b border-[#111111]">
                {headerRow.map((col, cIdx) => (
                  <th key={cIdx} className="p-3 font-mono font-extrabold text-xs uppercase tracking-wider border-r border-[#111111] last:border-r-0">
                    {col.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 font-medium text-sm text-[#111111] border-r border-[#111111] last:border-r-0">
                      {renderFormattedInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      currentTableRows = [];
      isInsideTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table line processing
    if (line.startsWith('|') && line.endsWith('|')) {
      isInsideTable = true;
      const cells = line.slice(1, -1).split('|');
      currentTableRows.push(cells);
      continue;
    } else if (isInsideTable) {
      if (!line) {
        continue;
      }
      flushTable();
    }

    if (!line) {
      continue;
    }

    // Header 1: Document Title (# Title)
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      const titleText = line.replace(/^#\s+/, '');
      elements.push(
        <div key={`h1-${keyCounter++}`} className="pb-3 mb-4 border-b border-[#111111] bg-[#F6F2EA] p-4 rounded-[6px] shadow-paper-sm border border-[#111111] font-sans">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-[4px] bg-[#FFC400] text-[#111111] font-mono text-[10px] font-extrabold uppercase border border-[#111111] shadow-paper-sm">
              STRUCTURED STUDY NOTES
            </span>
          </div>
          <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#111111] leading-snug">
            {titleText}
          </h1>
        </div>
      );
    }
    // Header 2: Special Callouts (Remember, Exam Focus, Common Confusion) or Major Concept (## 01 — ...)
    else if (line.startsWith('## ')) {
      const h2Text = line.replace(/^##\s+/, '');

      if (h2Text.includes('🧠 Remember') || h2Text.toLowerCase().includes('remember')) {
        elements.push(
          <div key={`remember-${keyCounter++}`} className="mt-6 mb-3 p-4 rounded-[6px] border border-[#111111] bg-[#FFC400]/15 text-[#111111] shadow-paper-sm font-sans">
            <div className="flex items-center gap-2 border-b border-[#111111] pb-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-[#111111] fill-[#FFC400]" />
              <h2 className="font-heading text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#111111] font-mono">
                🧠 REMEMBER (QUICK REVISION)
              </h2>
            </div>
          </div>
        );
      } else if (h2Text.includes('🎯 Exam Focus') || h2Text.toLowerCase().includes('exam focus')) {
        elements.push(
          <div key={`exam-${keyCounter++}`} className="mt-6 mb-3 p-4 rounded-[6px] border border-[#111111] bg-[#19B56B]/15 text-[#111111] shadow-paper-sm font-sans">
            <div className="flex items-center gap-2 border-b border-[#111111] pb-1.5 mb-2">
              <Target className="h-4 w-4 text-[#19B56B]" />
              <h2 className="font-heading text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#111111] font-mono">
                🎯 EXAM FOCUS & HIGH-YIELD TOPICS
              </h2>
            </div>
          </div>
        );
      } else if (h2Text.includes('⚠️ Common Confusion') || h2Text.toLowerCase().includes('common confusion')) {
        elements.push(
          <div key={`confusion-${keyCounter++}`} className="mt-6 mb-3 p-4 rounded-[6px] border border-[#111111] bg-[#FF4D4D]/15 text-[#111111] shadow-paper-sm font-sans">
            <div className="flex items-center gap-2 border-b border-[#111111] pb-1.5 mb-2">
              <AlertTriangle className="h-4 w-4 text-[#FF4D4D]" />
              <h2 className="font-heading text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#111111] font-mono">
                ⚠️ COMMON CONFUSION & DISTINCTIONS
              </h2>
            </div>
          </div>
        );
      } else if (h2Text.includes('🔥') || h2Text.toLowerCase().includes('teacher') || h2Text.toLowerCase().includes('high-weightage')) {
        elements.push(
          <div key={`teacher-callouts-${keyCounter++}`} className="mt-6 mb-3 p-4 rounded-[6px] border border-[#111111] bg-[#FFC400]/25 text-[#111111] shadow-paper-sm font-sans">
            <div className="flex items-center gap-2 border-b border-[#111111] pb-1.5 mb-2">
              <Flame className="h-4 w-4 text-[#FF4D4D] fill-[#FF4D4D]" />
              <h2 className="font-heading text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#111111] font-mono">
                🔥 TEACHER'S SPOKEN CALLOUTS & HIGH-WEIGHTAGE TOPICS
              </h2>
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={`h2-${keyCounter++}`} className="mt-6 mb-2.5 pt-2.5 border-t border-[#111111]/20 font-sans">
            <h2 className="font-heading text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#111111] dark:text-white flex items-center gap-2 font-mono border-b border-[#111111] pb-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFC400] border border-[#111111] inline-block shrink-0" />
              <span>{h2Text}</span>
            </h2>
          </div>
        );
      }
    }
    // Header 3: Subheadings (### Definition, ### Explanation, ### Formula, etc.)
    else if (line.startsWith('### ')) {
      const h3Text = line.replace(/^###\s+/, '');
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className="font-heading text-sm font-bold text-[#111111] dark:text-white mt-3.5 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wide">
          <span className="text-[#FFC400]">▪</span>
          <span>{h3Text}</span>
        </h3>
      );
    }
    // Lists: Bullet points (* or -)
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemText = line.replace(/^[*\-]\s+/, '');
      elements.push(
        <li key={`li-${keyCounter++}`} className="ml-4 pl-1 text-sm font-sans font-normal text-[#111111] dark:text-gray-200 leading-relaxed mb-2 list-disc">
          {renderFormattedInlineText(itemText)}
        </li>
      );
    }
    // Numbered lists (1. 2. 3.)
    else if (/^\d+\.\s+/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${keyCounter++}`} className="flex items-start gap-2.5 my-2.5 ml-1 text-sm font-sans">
            <span className="px-2 py-0.5 rounded-[4px] bg-[#FFC400] text-[#111111] font-mono font-extrabold border border-[#111111] text-xs shrink-0">
              {numMatch[1]}
            </span>
            <div className="font-normal text-[#111111] dark:text-gray-200 leading-relaxed pt-0.5">
              {renderFormattedInlineText(numMatch[2])}
            </div>
          </div>
        );
      }
    }
    // Standard Paragraph
    else {
      elements.push(
        <p key={`p-${keyCounter++}`} className="text-sm font-sans font-normal text-[#111111] dark:text-gray-200 leading-relaxed mb-3.5">
          {renderFormattedInlineText(line)}
        </p>
      );
    }
  }

  // Ensure lingering tables are rendered
  if (isInsideTable) {
    flushTable();
  }

  return (
    <div 
      className="academic-notes-container text-sm space-y-2 selection:bg-[#FFC400] selection:text-[#111111] relative font-sans"
    >
      {/* AI AUTO-FORMAT TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 mb-4 rounded-[6px] border border-[#111111] bg-[#F6F2EA] shadow-paper-sm text-xs font-mono font-bold print:hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#FFC400] fill-[#FFC400]" />
          <span className="text-[#111111]">NOTES & TABLE STRUCTURE</span>
        </div>
        <button
          onClick={handleAIFormatClick}
          disabled={isFormattingAI}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#FFC400] text-[#111111] rounded-[4px] border border-[#111111] shadow-paper-sm hover:bg-[#ffe066] transition-all cursor-pointer font-extrabold disabled:opacity-50"
          title="Use AI to automatically re-structure notes into clean Markdown and convert comparison lists into proper tables"
        >
          {isFormattingAI ? (
            <>
              <div className="w-3 h-3 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
              <span>FORMATTING WITH AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>✨ AUTO-FORMAT WITH AI</span>
            </>
          )}
        </button>
      </div>

      {elements}
    </div>
  );
};
