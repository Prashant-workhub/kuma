/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompetencyAttemptHistoryItem, TraineeCompetency } from '../types';
import { Modal, Button, Badge } from './bauhaus';
import { History, Award, CheckCircle2, XCircle } from 'lucide-react';

interface CompetencyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  competency: TraineeCompetency | null;
}

export default function CompetencyHistoryModal({
  isOpen,
  onClose,
  competency
}: CompetencyHistoryModalProps) {
  if (!isOpen || !competency) return null;

  const history = competency.assessmentHistory || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ASSESSMENT HISTORY: ${competency.name.toUpperCase()}`}
      size="md"
    >
      <div className="space-y-4 select-none p-1">
        
        {/* Competency Summary Header */}
        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] flex justify-between items-center shadow-paper-xs">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">DECLARED LEVEL</span>
            <div className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase">
              {competency.level}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">LATEST ASSESSED</span>
            <div className="font-heading font-extrabold text-sm text-[#19B56B] dark:text-[#00E676] uppercase">
              {competency.latestAssessedLevel ? `${competency.latestAssessedLevel} (${competency.latestScorePercentage}%)` : 'Not Assessed Yet'}
            </div>
          </div>
        </div>

        {/* Attempt History List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            ATTEMPT RECORDS ({history.length})
          </h4>

          {history.length === 0 ? (
            <div className="p-6 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-center font-mono text-xs text-[var(--text-secondary)]">
              No previous assessment attempts recorded for this competency.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {history.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-3.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] flex items-center justify-between gap-3 shadow-paper-xs hover:border-[#FFC400] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-heading font-bold text-xs text-[var(--text-primary)]">
                        {attempt.quizTitle}
                      </h5>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        attempt.passed ? 'bg-[#19B56B]/20 text-[#19B56B]' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {attempt.passed ? 'PASSED' : 'NOT PASSED'}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {attempt.subject || 'Training Program'} • {attempt.attemptDate ? new Date(attempt.attemptDate).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-heading font-black text-sm text-[var(--text-primary)]">
                      {attempt.scorePercentage}%
                    </div>
                    <div className="text-[10px] font-mono text-[#9C27B0] font-bold uppercase">
                      Level: {attempt.assessedLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Close Button */}
        <div className="flex justify-end pt-3 border-t border-[var(--border-main)]">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Close History
          </Button>
        </div>
      </div>
    </Modal>
  );
}
