/**
 * Project Kuma - Digital Certificate Modal
 * Renders an official, printable Digital Certificate of Completion with QR code.
 */

import React from 'react';
import { TrainingCertificate } from '../types';
import { Button } from './bauhaus';
import { Award, CheckCircle2, ShieldCheck, Printer, Share2, X, ExternalLink, GraduationCap } from 'lucide-react';

interface CertificateModalProps {
  certificate: TrainingCertificate | any;
  onClose: () => void;
}

export default function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  const [copied, setCopied] = React.useState(false);

  const certId = certificate.certId || certificate.id;
  const verificationUrl = `/verify-certificate?id=${certId}`;
  const fullVerificationUrl = `${window.location.origin}${verificationUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullVerificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const traineeName = certificate.traineeName || certificate.userName || 'Trainee Learner';
  const courseTitle = certificate.courseTitle || certificate.courseName || 'Capacity Building Program';
  const orgName = certificate.orgId || certificate.organization || 'Kuma Platform';
  const issueDate = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString()
    : (certificate.issueDate || certificate.completionDate || new Date().toLocaleDateString());

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md overflow-y-auto select-none print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-2xl p-6 md:p-8 space-y-6 relative print:border-none print:shadow-none print:w-full print:max-w-none print:p-0">

        {/* Top Header Controls (Hidden during print) */}
        <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-[#FFC400]" />
            <h3 className="font-heading font-black text-lg text-[var(--text-primary)] uppercase tracking-tight">
              Kuma Digital Certificate
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="sm" onClick={handleCopyLink} className="text-xs">
              <Share2 className="h-3.5 w-3.5 mr-1" />
              {copied ? 'Link Copied!' : 'Share Link'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint} className="text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[4px] border border-[var(--border-main)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE FRAME */}
        <div className="rounded-[8px] border-4 border-double border-[#9C27B0]/60 bg-gradient-to-b from-[var(--bg-main)] via-[var(--card-bg)] to-[var(--bg-main)] p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-inner print:border-4 print:p-10">

          {/* Watermark / Background Accent */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <GraduationCap className="h-96 w-96 text-[#9C27B0]" />
          </div>

          {/* Certificate Header Banner */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9C27B0]/40 bg-[#9C27B0]/10 text-[#9C27B0] font-mono text-xs font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" />
              <span>SERVER-ISSUED VERIFIABLE CREDENTIAL</span>
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-[var(--text-primary)] uppercase tracking-wider mt-2">
              CERTIFICATE OF COMPLETION
            </h1>
            <p className="text-xs font-mono text-[var(--text-secondary)] tracking-widest uppercase">
              Project Kuma Capacity Building Platform
            </p>
          </div>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FFC400] to-transparent mx-auto my-4" />

          {/* Certifies Text */}
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase text-[var(--text-secondary)] tracking-widest">
              THIS CERTIFIES THAT
            </p>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-purple-600 dark:text-purple-400 uppercase tracking-tight underline decoration-[#FFC400] decoration-2 underline-offset-8">
              {traineeName}
            </h2>
            {certificate.designation && (
              <p className="text-xs font-mono text-[var(--text-secondary)] font-bold">
                {certificate.designation} {certificate.department ? `• ${certificate.department}` : ''}
              </p>
            )}
          </div>

          {/* Training Description */}
          <div className="space-y-3 py-2 max-w-xl mx-auto">
            <p className="text-xs font-mono uppercase text-[var(--text-secondary)] tracking-widest">
              HAS SUCCESSFULLY COMPLETED THE CAPACITY BUILDING PROGRAM
            </p>
            <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] shadow-paper-xs">
              <h3 className="font-heading font-black text-xl text-[var(--text-primary)] uppercase">
                {courseTitle}
              </h3>
              <div className="text-xs font-mono font-bold text-[#FFC400] mt-1">
                COURSE CODE: {certificate.courseCode || certificate.courseId || 'TRN-2026'}
              </div>
            </div>
          </div>

          {/* Competencies Addressed */}
          {(certificate.competenciesAddressed || certificate.competencyGains) && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary)]">
                COMPETENCIES VERIFIED:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(certificate.competenciesAddressed || (certificate.competencyGains || []).map((cg: any) => cg.competencyId)).map((cName: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] uppercase"
                  >
                    ✓ {cName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Metadata & Stamp */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t-2 border-[var(--border-main)]/50 items-center text-left md:text-center">

            {/* Organization */}
            <div>
              <div className="text-[10px] font-mono uppercase text-[var(--text-secondary)] font-bold">ISSUING ORGANIZATION</div>
              <div className="text-xs font-mono font-black text-[var(--text-primary)] mt-0.5 uppercase">
                {orgName}
              </div>
            </div>

            {/* Date & ID */}
            <div>
              <div className="text-[10px] font-mono uppercase text-[var(--text-secondary)] font-bold">COMPLETION DATE</div>
              <div className="text-xs font-mono font-black text-[var(--text-primary)] mt-0.5">
                {issueDate}
              </div>
              <div className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
                ID: {certId}
              </div>
            </div>

            {/* Verification Stamp & QR Code */}
            <div className="flex flex-col items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(fullVerificationUrl)}`}
                alt="Verification QR Code"
                className="w-20 h-20 border border-[var(--border-main)] p-1 rounded bg-white shadow-sm mb-1"
              />
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-[#19B56B]/40 bg-[#19B56B]/15 text-[#19B56B] text-[10px] font-mono font-black uppercase">
                <CheckCircle2 className="h-3 w-3" />
                <span>VERIFIED VALID</span>
              </div>
              <a
                href={fullVerificationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] font-mono text-[var(--text-secondary)] hover:underline mt-1 flex items-center gap-0.5 print:hidden"
              >
                <span>Verify Online</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
