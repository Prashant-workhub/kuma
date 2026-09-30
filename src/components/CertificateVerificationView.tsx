/**
 * Project Kuma - Public Certificate Verification Page
 * Publicly verifies server-issued training completion certificates via GET /api/certificates/verify/:certId
 * Never exposes private user data (UID/Email).
 */

import React, { useState, useEffect } from 'react';
import { verifyServerCertificate, PublicVerificationResponse } from '../services/certificateService';
import { ShieldCheck, CheckCircle2, AlertCircle, Search, ArrowLeft, Building, Calendar, Hash, XCircle, AlertTriangle } from 'lucide-react';

interface CertificateVerificationViewProps {
  setActivePage: (page: any) => void;
  certIdParam?: string;
}

export default function CertificateVerificationView({
  setActivePage,
  certIdParam
}: CertificateVerificationViewProps) {
  const [searchId, setSearchId] = useState<string>(certIdParam || '');
  const [result, setResult] = useState<PublicVerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (certIdParam && certIdParam.trim()) {
      setSearchId(certIdParam.trim());
      void lookupCertificate(certIdParam.trim());
    }
  }, [certIdParam]);

  const lookupCertificate = async (certificateId: string) => {
    if (!certificateId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await verifyServerCertificate(certificateId.trim());
      setResult(resp);
    } catch (lookupError: any) {
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
            Verify official server-issued Capacity Building training certificates via HMAC-SHA256 signature verification.
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
              placeholder="Enter certificate ID (e.g. KUMA-2026-DA10199X)"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#992e9d] dark:focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{loading ? 'Verifying…' : 'Verify Certificate'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* VERIFICATION RESULT DISPLAY */}
      {result && (
        <div className="p-6 md:p-8 rounded-[11px] bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">

          {/* VALID STATE */}
          {result.status === 'valid' && (
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
                      HMAC-SHA256 cryptographic signature matches server records. Certificate is authentic and active.
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
                      {result.traineeName}
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    ID: {result.certId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Training Program</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {result.courseTitle}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Issuing Organization</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>{result.orgName || 'Kuma Platform'}</span>
                    </div>
                  </div>

                  {result.competencyGains && result.competencyGains.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Competency Gains</div>
                      <div className="font-semibold text-[#992e9d] dark:text-purple-300 mt-0.5">
                        {result.competencyGains.map((cg) => cg.competencyId).join(', ')}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Issue Date</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    <span>Server Status: Valid</span>
                  </div>
                  <div>Certificate ID: {result.certId}</div>
                </div>

              </div>

            </div>
          )}

          {/* REVOKED STATE */}
          {result.status === 'revoked' && (
            <div className="p-8 text-center rounded-[11px] border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto" />
              <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-200">
                Certificate Revoked
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mx-auto">
                This certificate (ID: <span className="font-mono">{result.certId}</span>) was revoked by platform administrators on {result.revokedAt ? new Date(result.revokedAt).toLocaleDateString() : 'an administrative review'}.
              </p>
              {result.traineeName && (
                <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-amber-200 dark:border-amber-900">
                  Issued to: <span className="font-semibold">{result.traineeName}</span> ({result.courseTitle})
                </div>
              )}
            </div>
          )}

          {/* NOT FOUND STATE */}
          {result.status === 'not_found' && (
            <div className="p-8 text-center rounded-[11px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="font-semibold text-base text-rose-900 dark:text-rose-200">
                Certificate Not Found
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                {result.message || 'No matching certificate record was found for the provided Certificate ID. Double-check the ID and try again.'}
              </p>
            </div>
          )}

          {/* INVALID / TAMPERED STATE */}
          {result.status === 'invalid' && (
            <div className="p-8 text-center rounded-[11px] border border-rose-400 dark:border-rose-800 bg-rose-100/60 dark:bg-rose-950/40 space-y-3">
              <XCircle className="h-12 w-12 text-rose-600 dark:text-rose-400 mx-auto" />
              <h3 className="font-semibold text-lg text-rose-900 dark:text-rose-200">
                Verification Failed: Signature Invalid
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
                {result.message || 'Cryptographic signature mismatch. The certificate data has been altered or tampered with.'}
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
