/**
 * Project Kuma - Trainee Certificates Workspace View
 * Displays all earned certificates with preview, print, download, and verification links.
 * Clean Tutedude Dashboard style architecture.
 */

import React, { useState } from 'react';
import { UserSettings, TrainingCertificate } from '../types';
import { getUserCertificates } from '../utils/certificateUtils';
import CertificateModal from './CertificateModal';
import { Award, CheckCircle2, ArrowLeft, ExternalLink, Printer, ShieldCheck, GraduationCap, Building, Calendar } from 'lucide-react';

interface CertificatesViewProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
}

export default function CertificatesView({ settings, setActivePage }: CertificatesViewProps) {
  const [selectedCert, setSelectedCert] = useState<TrainingCertificate | null>(null);
  const userCerts = getUserCertificates(settings.profile.uid || 'user-demo-1');

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 p-4 md:p-8 select-none font-sans">
      
      {/* Header Banner */}
      <div className="rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#992e9d] dark:text-slate-400 dark:hover:text-purple-300 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="font-semibold text-2xl md:text-3xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Award className="h-7 w-7 text-[#992e9d] dark:text-purple-400" />
            My Digital Certificates
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official Capacity Building training completion records and verified digital credentials.
          </p>
        </div>

        <div className="p-4 rounded-full border border-purple-100 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 text-xs flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Earned Certificates</div>
            <div className="text-xl font-bold text-[#992e9d] dark:text-purple-300">{userCerts.length}</div>
          </div>
          <div className="w-px h-7 bg-purple-200 dark:bg-purple-800/60" />
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Verification Status</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Verified
            </div>
          </div>
        </div>
      </div>

      {/* CERTIFICATES LIST */}
      <div className="p-6 rounded-[11px] bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#992e9d] dark:text-purple-400" />
            Issued Training Credentials
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Publicly Verifiable
          </span>
        </div>

        {userCerts.length === 0 ? (
          <div className="p-10 text-center rounded-[11px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <GraduationCap className="h-10 w-10 text-slate-400 mx-auto opacity-50" />
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
              No Certificates Earned Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Complete your recommended training programs and pass required assessments to automatically earn official digital certificates!
            </p>
            <button
              onClick={() => setActivePage('skill-gap')}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#992e9d] hover:bg-[#832687] text-white text-xs font-medium shadow-sm transition-all inline-flex items-center gap-2"
            >
              Explore Skill Gap & Recommended Training
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {userCerts.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-[11px] border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#080D1A] flex flex-col justify-between space-y-4 hover:border-[#992e9d] dark:hover:border-purple-600 transition-all relative overflow-hidden group"
              >
                <div className="space-y-3">
                  
                  {/* Top Line */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                      {cert.courseCode}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> VERIFIED
                    </span>
                  </div>

                  {/* Title & Organization */}
                  <div>
                    <h4 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-[#992e9d] dark:group-hover:text-purple-300 transition-colors">
                      {cert.courseName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>{cert.organization || 'Ministry of Skill Development'}</span>
                    </p>
                  </div>

                  {/* Competency Badge & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#992e9d]" />
                      <span className="font-medium">{cert.competenciesAddressed?.join(', ') || 'Competency Mastery'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{cert.issueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                    ID: {cert.id}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePage('verify-certificate')}
                      className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                      title="Public Verification"
                    >
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                      <span>Verify</span>
                    </button>

                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-4 py-1.5 rounded-full bg-[#992e9d] hover:bg-[#832687] text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>View Credential</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

    </div>
  );
}
