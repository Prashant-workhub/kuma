/**
 * Project Kuma - Phase 3F Trainee Certificates Workspace View
 * Displays all earned certificates with preview, print, download, and verification links.
 */

import React, { useState } from 'react';
import { UserSettings, TrainingCertificate } from '../types';
import { getUserCertificates } from '../utils/certificateUtils';
import CertificateModal from './CertificateModal';
import { Card, Button, Badge } from './bauhaus';
import { Award, CheckCircle2, ArrowLeft, ExternalLink, Printer, ShieldCheck, GraduationCap, Building, Calendar } from 'lucide-react';

interface CertificatesViewProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
}

export default function CertificatesView({ settings, setActivePage }: CertificatesViewProps) {
  const [selectedCert, setSelectedCert] = useState<TrainingCertificate | null>(null);
  const userCerts = getUserCertificates(settings.profile.uid || 'user-demo-1');

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* Header Banner */}
      <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>BACK TO DASHBOARD</span>
          </button>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
            <Award className="h-7 w-7 text-[#FFC400]" />
            MY DIGITAL CERTIFICATES
          </h1>
          <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)] mt-1">
            Official Kuma Capacity Building training completion records and verified digital credentials.
          </p>
        </div>

        <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] font-mono text-xs flex items-center gap-3 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Earned Certificates</div>
            <div className="font-heading font-black text-xl text-[#FFC400]">{userCerts.length}</div>
          </div>
          <div className="w-px h-8 bg-[var(--border-main)]" />
          <div>
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Verification Status</div>
            <div className="font-heading font-black text-xs text-[#19B56B]">100% VERIFIED</div>
          </div>
        </div>
      </div>

      {/* CERTIFICATES LIST */}
      <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
          <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#9C27B0]" />
            ISSUED TRAINING CERTIFICATES
          </h3>
          <span className="text-xs font-mono text-[var(--text-secondary)] font-bold">
            Publicly Verifiable
          </span>
        </div>

        {userCerts.length === 0 ? (
          <div className="p-8 text-center rounded-[6px] border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)] space-y-2">
            <GraduationCap className="h-10 w-10 text-[var(--text-secondary)] mx-auto opacity-40" />
            <h4 className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase">
              NO CERTIFICATES EARNED YET
            </h4>
            <p className="text-xs font-mono text-[var(--text-secondary)] max-w-md mx-auto">
              Complete your recommended training programs and pass required assessments to automatically earn official digital certificates!
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActivePage('skill-gap')}
              className="mt-2 bg-[#9C27B0] text-white"
            >
              Explore Skill Gap & Recommended Training
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCerts.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] flex flex-col justify-between space-y-4 shadow-paper-sm hover:shadow-paper transition-shadow relative overflow-hidden"
              >
                <div className="space-y-3">
                  
                  {/* Top Line */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40">
                      {cert.courseCode}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#19B56B] px-2 py-0.5 rounded bg-[#19B56B]/15 border border-[#19B56B]/40">
                      <CheckCircle2 className="h-3 w-3" />
                      VERIFIED VALID
                    </span>
                  </div>

                  {/* Course Title */}
                  <div>
                    <h4 className="font-heading font-black text-base text-[var(--text-primary)] uppercase leading-snug">
                      {cert.courseName}
                    </h4>
                    <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                      Issued to: <span className="font-bold text-[var(--text-primary)]">{cert.userName}</span>
                    </p>
                  </div>

                  {/* Metadata Box */}
                  <div className="p-3 rounded-[4px] border border-[var(--border-main)] bg-[var(--card-bg)] space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">Organization:</span>
                      <span className="font-bold text-[var(--text-primary)] truncate max-w-[180px]">{cert.organization}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">Issue Date:</span>
                      <span className="font-bold text-[var(--text-primary)]">{cert.issueDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">Certificate ID:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{cert.id}</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-[var(--border-main)]/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActivePage('verify-certificate')}
                    className="text-[11px] font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Public Verification</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedCert(cert)}
                    className="bg-[#9C27B0] hover:bg-[#8E24AA] text-white flex items-center gap-1.5"
                  >
                    <Award className="h-4 w-4" />
                    <span>View Certificate</span>
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CERTIFICATE MODAL PREVIEW */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

    </div>
  );
}
