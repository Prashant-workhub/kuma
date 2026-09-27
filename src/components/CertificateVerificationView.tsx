/**
 * Project Kuma - Phase 3F Public Certificate Verification Page
 * Publicly verifies training completion certificates without exposing sensitive user data.
 */

import React, { useState, useEffect } from 'react';
import { verifyCertificate, VerificationResult } from '../utils/certificateUtils';
import { Card, Button, Badge } from './bauhaus';
import { ShieldCheck, CheckCircle2, AlertCircle, Search, ArrowLeft, GraduationCap, Building, Calendar, Hash } from 'lucide-react';

interface CertificateVerificationViewProps {
  setActivePage: (page: any) => void;
  certIdParam?: string;
}

export default function CertificateVerificationView({
  setActivePage,
  certIdParam
}: CertificateVerificationViewProps) {
  const [searchId, setSearchId] = useState<string>(certIdParam || '');
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    // If certIdParam passed in URL, auto-verify
    if (certIdParam) {
      setResult(verifyCertificate(certIdParam));
    } else {
      // Default to demo ID if none passed
      setResult(verifyCertificate('KUMA-2026-DA10199X'));
      setSearchId('KUMA-2026-DA10199X');
    }
  }, [certIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setResult(verifyCertificate(searchId.trim()));
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 bg-grid-paper p-4 md:p-8 select-none">
      
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
            <ShieldCheck className="h-7 w-7 text-[#19B56B]" />
            PUBLIC CERTIFICATE VERIFICATION
          </h1>
          <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)] mt-1">
            Verify official Project Kuma Capacity Building training completion certificates.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card shadow="sm" className="p-4 bg-[var(--card-bg)] border-2 border-[var(--border-main)]">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. KUMA-2026-DA10199X)"
              className="w-full pl-9 pr-3 py-2 rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] font-mono text-xs font-bold text-[var(--text-primary)] outline-none focus:border-purple-500"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="bg-[#19B56B] hover:bg-[#159A5A] text-white">
            Verify Certificate
          </Button>
        </form>
      </Card>

      {/* VERIFICATION RESULT DISPLAY */}
      {result && (
        <Card shadow="md" className="p-6 md:p-8 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-6">
          
          {result.isValid && result.certificate ? (
            <div className="space-y-6">
              
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[6px] border-2 border-[#19B56B]/40 bg-[#19B56B]/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-[#19B56B] shrink-0" />
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#19B56B] uppercase">
                      OFFICIAL CERTIFICATE VERIFIED
                    </h3>
                    <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                      {result.message}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded border border-[#19B56B]/50 bg-[#19B56B] text-white font-mono text-xs font-black uppercase tracking-wider self-start sm:self-center shadow-paper-xs">
                  STATUS: VALID
                </span>
              </div>

              {/* Public Verification Metadata Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Course Name & Code */}
                <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
                    <span>TRAINING PROGRAM</span>
                  </div>
                  <div className="font-heading font-black text-base text-[var(--text-primary)] uppercase">
                    {result.certificate.courseName}
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    CODE: {result.certificate.courseCode}
                  </div>
                </div>

                {/* Issued To (Name Only - No sensitive data) */}
                <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#FFC400]" />
                    <span>ISSUED TO</span>
                  </div>
                  <div className="font-heading font-black text-base text-[var(--text-primary)] uppercase">
                    {result.certificate.userName}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] italic">
                    Public Verified Trainee
                  </div>
                </div>

                {/* Issuing Organization */}
                <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-blue-500" />
                    <span>ISSUING ORGANIZATION</span>
                  </div>
                  <div className="font-heading font-bold text-sm text-[var(--text-primary)] uppercase">
                    {result.certificate.organization}
                  </div>
                </div>

                {/* Completion Date & ID */}
                <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    <span>COMPLETION DATE & ID</span>
                  </div>
                  <div className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {result.certificate.completionDate}
                  </div>
                  <div className="text-xs font-mono font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                    <Hash className="h-3 w-3" />
                    <span>{result.certificate.id}</span>
                  </div>
                </div>

              </div>

              {/* Verified Competencies */}
              {result.certificate.competenciesAddressed && result.certificate.competenciesAddressed.length > 0 && (
                <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">
                    VERIFIED COMPETENCIES:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.certificate.competenciesAddressed.map((cName, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                      >
                        ✓ {cName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 text-center rounded-[6px] border-2 border-red-500/40 bg-red-500/10 space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="font-heading font-black text-lg text-red-600 dark:text-red-400 uppercase">
                INVALID CERTIFICATE ID
              </h3>
              <p className="text-xs font-mono text-[var(--text-secondary)] max-w-md mx-auto">
                {result.message} Please check the Certificate ID for typos or verify that the certificate was issued by Project Kuma.
              </p>
            </div>
          )}

        </Card>
      )}

    </div>
  );
}
