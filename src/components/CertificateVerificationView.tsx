/**
 * Project Kuma - Public Certificate Verification Page
 * Publicly verifies training completion certificates without exposing sensitive user data.
 * Clean Tutedude Dashboard design architecture.
 */

import React, { useState, useEffect } from 'react';
import { VerificationResult } from '../utils/certificateUtils';
import { verifyPersistentCertificate } from '../services/capacityConnectService';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (certIdParam) {
      setSearchId(certIdParam);
      void lookupCertificate(certIdParam);
    }
  }, [certIdParam]);

  const lookupCertificate = async (certificateId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const record = await verifyPersistentCertificate(certificateId);
      if (!record || record.verificationIdentifier !== certificateId.trim() || record.verificationStatus !== 'valid') {
        setResult({ isValid: false, message: 'No valid certificate record was found for this verification ID.' });
        return;
      }
      setResult({
        isValid: true,
        message: 'Certificate record found and its verification status is valid.',
        certificate: {
          id: record.certificateId,
          userName: record.traineeName,
          courseName: record.trainingProgramName,
          courseCode: record.courseCode,
          organization: record.organization,
          issueDate: record.issueDate,
          completionDate: record.completionDate,
          status: 'Valid',
          competenciesAddressed: record.competenciesAddressed
        }
      });
    } catch (lookupError) {
      console.error('[CertificateVerification] Lookup failed:', lookupError);
      setError('Unable to verify this certificate right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      await lookupCertificate(searchId.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 p-4 md:p-8 select-none font-sans">

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
            <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Public Certificate Verification
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verify official Capacity Building training completion certificates.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-[11px] bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter certificate verification ID"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] dark:focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{loading ? 'Checking…' : 'Verify Certificate'}</span>
          </button>
        </form>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}

      {/* VERIFICATION RESULT DISPLAY */}
      {result && (
        <div className="p-6 md:p-8 rounded-[11px] bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">

          {result.isValid && result.certificate ? (
            <div className="space-y-6">

              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-full border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base text-emerald-800 dark:text-emerald-300">
                      Official Certificate Verified
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {result.message}
                    </p>
                  </div>
                </div>

                <span className="px-3.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold self-start sm:self-auto shadow-sm">
                  VALID & AUTHENTICATED
                </span>
              </div>

              {/* Certificate Details Card */}
              <div className="p-6 rounded-[11px] border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A] space-y-5">

                <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recipient Name</div>
                    <div className="font-semibold text-lg text-slate-900 dark:text-white">
                      {result.certificate.userName}
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    {result.certificate.courseCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Training Program</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {result.certificate.courseName}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Issuing Organization</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>{result.certificate.organization || 'Ministry of Skill Development'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Competencies Mastered</div>
                    <div className="font-semibold text-[#992e9d] dark:text-purple-300 mt-0.5">
                      {result.certificate.competenciesAddressed?.join(', ') || 'Data Analysis & Insights'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Issue Date</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{result.certificate.issueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    <span>Status: {result.certificate.status || 'Verified'}</span>
                  </div>
                  <div>Certificate ID: {result.certificate.id}</div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 text-center rounded-[11px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="font-semibold text-base text-rose-900 dark:text-rose-200">
                Verification Failed
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                {result.message || 'No matching certificate record was found for the provided Certificate ID.'}
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
