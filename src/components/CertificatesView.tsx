/**
 * Project Kuma - Trainee Certificates Workspace View
 * Displays all earned certificates with preview, print, download, and verification links.
 * Enterprise Skills Intelligence Architecture.
 */

import React, { useState, useEffect } from 'react';
import { UserSettings, TrainingCertificate } from '../types';
import { getUserCertificates } from '../utils/certificateUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { subscribeUserCertificates } from '../services/capacityConnectService';
import CertificateModal from './CertificateModal';
import {
  Award,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Building,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  SectionHeading,
  TraineeBadge,
  TraineeButton,
  TraineeCard,
  TraineeEmptyState,
  TraineeKpi
} from './trainee/TraineeUI';

interface CertificatesViewProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
}

export default function CertificatesView({ settings, setActivePage }: CertificatesViewProps) {
  const [selectedCert, setSelectedCert] = useState<TrainingCertificate | null>(null);
  const userId = settings.profile.uid || '';
  const isDemoTrainee = isDemoTraineeIdentity(userId, settings.profile.emailAddress);
  const [userCerts, setUserCerts] = useState<TrainingCertificate[]>(() =>
    isDemoTrainee ? getUserCertificates(settings.profile.emailAddress) : []
  );
  const [loading, setLoading] = useState(!isDemoTrainee);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoTrainee) {
      setUserCerts(getUserCertificates(settings.profile.emailAddress));
      setLoading(false);
      setLoadError(null);
      return;
    }
    if (!userId) {
      setUserCerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    return subscribeUserCertificates(
      userId,
      (certificates) => {
        setUserCerts(certificates);
        setLoading(false);
      },
      (error) => {
        console.error('[Certificates] Certificate subscription failed:', error);
        setLoadError('Unable to load your certificates. Check your connection and try again.');
        setLoading(false);
      }
    );
  }, [userId, settings.profile.emailAddress, isDemoTrainee]);

  const verifiedCount = userCerts.filter((certificate) => certificate.verified).length;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 p-4 md:p-8 select-none font-sans animate-fade-in">

      {/* Header Banner */}
      <div className="space-y-4">
        <button
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-faint hover:text-brand-cyan transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2.5">
              <Award className="h-7 w-7 text-brand-violet" />
              Verified Career Credentials
            </h1>
            <p className="text-xs md:text-sm text-muted mt-1 leading-relaxed">
              Authenticated capacity building completion records and cryptographic skills verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TraineeKpi
              label="Earned Credentials"
              value={userCerts.length}
              icon={<Award size={18} />}
              accent="violet"
            />
            <TraineeKpi
              label="Verification Status"
              value={userCerts.length ? `${verifiedCount}/${userCerts.length}` : '0/0'}
              icon={<ShieldCheck size={18} />}
              accent="emerald"
            />
          </div>
        </div>
      </div>

      {/* CERTIFICATES LIST */}
      <section className="space-y-4">
        <SectionHeading
          title="Issued Training Certificates"
          subtitle="Publicly verifiable skills certificates backed by capacity connect governance"
          icon={<ShieldCheck className="h-5 w-5 text-brand-violet" />}
        />

        {loading ? (
          <div className="p-12 text-center text-sm text-muted">Loading verified credentials…</div>
        ) : loadError ? (
          <div role="alert" className="p-5 rounded-xl border border-brand-rose/40 bg-brand-rose/10 text-sm text-brand-rose">
            {loadError}
          </div>
        ) : userCerts.length === 0 ? (
          <TraineeEmptyState
            icon={<GraduationCap size={24} />}
            title="No Certificates Earned Yet"
            description="Complete your assigned training programs and pass required assessments to earn official digital certificates."
            action={
              <TraineeButton
                size="sm"
                variant="accent"
                iconRight={<ArrowRight size={14} />}
                onClick={() => setActivePage('skill-gap')}
              >
                Explore Skill Gap & Training
              </TraineeButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCerts.map((cert) => (
              <TraineeCard
                key={cert.id}
                className="flex flex-col justify-between space-y-5 border-t-2 border-t-brand-violet relative overflow-hidden group hover:scale-[1.01] transition-all duration-300"
              >
                <div className="space-y-3.5">
                  {/* Top Badge Line */}
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="font-bold uppercase px-2.5 py-1 rounded bg-brand-violet/15 text-brand-violet border border-brand-violet/30">
                      {cert.courseCode || 'KUMA-CERT'}
                    </span>
                    <span className="font-bold text-brand-emerald flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> CRYPTOGRAPHICALLY VERIFIED
                    </span>
                  </div>

                  {/* Title & Organization */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-ink group-hover:text-brand-violet transition-colors leading-snug">
                      {cert.courseName}
                    </h3>
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-faint" />
                      <span>{cert.organization || 'National Digital Capacity Building Framework'}</span>
                    </p>
                  </div>

                  {/* Competencies & Issue Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-line">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Layers className="h-3.5 w-3.5 text-brand-cyan" />
                      <span className="font-medium text-ink">{cert.competenciesAddressed?.join(', ') || 'Competency Mastery'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-faint font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{cert.issueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-faint truncate max-w-[140px]">
                    ID: {cert.id}
                  </div>

                  <div className="flex items-center gap-2">
                    <TraineeButton
                      size="sm"
                      variant="secondary"
                      onClick={() => setActivePage('verify-certificate')}
                      iconLeft={<ExternalLink className="h-3.5 w-3.5" />}
                    >
                      Verify
                    </TraineeButton>

                    <TraineeButton
                      size="sm"
                      variant="accent"
                      onClick={() => setSelectedCert(cert)}
                      iconLeft={<Award className="h-3.5 w-3.5" />}
                    >
                      Credential
                    </TraineeButton>
                  </div>
                </div>

              </TraineeCard>
            ))}
          </div>
        )}
      </section>

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
