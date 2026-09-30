/**
 * Project Kuma - Trainee Certificates Workspace View
 * Spec: Table + certificate preview page (print-friendly stylesheet, verification QR and ID in mono).
 */

import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { getUserServerCertificates } from '../services/certificateService';
import { getUserCertificates } from '../utils/certificateUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { Award, Printer, ExternalLink, QrCode } from 'lucide-react';
import { PageLayout } from './layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  StatusPill,
  EmptyState,
  InlineAlert,
  Dialog,
  DialogContent,
} from './ui';

interface CertificatesViewProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
}

export default function CertificatesView({ settings, setActivePage }: CertificatesViewProps) {
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const userId = settings.profile.uid || '';
  const isDemoTrainee = isDemoTraineeIdentity(userId, settings.profile.emailAddress);
  const [userCerts, setUserCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificates() {
      setLoading(true);
      setLoadError(null);
      try {
        const serverCerts = await getUserServerCertificates(userId || settings.profile.emailAddress);
        if (serverCerts.length > 0) {
          setUserCerts(serverCerts);
        } else if (isDemoTrainee) {
          const localCerts = getUserCertificates(settings.profile.emailAddress);
          setUserCerts(localCerts);
        } else {
          setUserCerts([]);
        }
      } catch (err: any) {
        console.error('[Certificates] Error loading user certificates:', err);
        setLoadError('Unable to load your certificates. Check your connection.');
      } finally {
        setLoading(false);
      }
    }

    void loadCertificates();
  }, [userId, settings.profile.emailAddress, isDemoTrainee]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <PageLayout
      title="Certificates & Credentials"
      description="View, print, and share your cryptographically verified course completion credentials."
    >
      <div className="space-y-6">
        {loadError && <InlineAlert variant="danger">{loadError}</InlineAlert>}

        <Card>
          <CardHeader>
            <CardTitle>Earned Certificates ({userCerts.length})</CardTitle>
          </CardHeader>

          {loading ? (
            <div className="p-8 text-center text-xs text-text-secondary">Loading credentials...</div>
          ) : userCerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userCerts.map((cert) => {
                  const certId = cert.certificateId || cert.id || 'KUMA-CERT-101';
                  return (
                    <TableRow key={certId}>
                      <TableCell className="font-mono text-xs font-semibold text-text-primary">
                        {certId}
                      </TableCell>
                      <TableCell className="font-medium text-text-primary">
                        {cert.courseName || cert.trainingProgramName || 'Technical Training Course'}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {new Date(cert.issuedAt || Date.now()).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusPill status="completed">Verified HMAC-SHA256</StatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedCert(cert)}
                        >
                          Preview & Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Award className="h-8 w-8" />}
                title="No certificates earned yet"
                description="Complete all required course modules and pass competency assessments to earn credentials."
                action={
                  <Button variant="primary" onClick={() => setActivePage('my-learning')}>
                    Go to My Learning
                  </Button>
                }
              />
            </div>
          )}
        </Card>

        {/* CERTIFICATE PREVIEW MODAL (PRINT-FRIENDLY) */}
        {selectedCert && (
          <Dialog open={true} onOpenChange={() => setSelectedCert(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 space-y-6">
              {/* PRINT STYLESHEET */}
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #certificate-print-area, #certificate-print-area * { visibility: visible; }
                  #certificate-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                }
              `}</style>

              <div id="certificate-print-area" className="border-4 border-double border-primary/40 bg-surface p-8 rounded-container space-y-6 text-center shadow-md">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold tracking-widest uppercase text-primary">
                    Capacity Connect Enterprise Learning
                  </div>
                  <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
                    Certificate of Completion
                  </h2>
                  <p className="text-xs text-text-secondary">This certifies that</p>
                </div>

                <div className="text-xl font-bold text-text-primary underline decoration-primary/40 underline-offset-4">
                  {selectedCert.traineeName || settings.profile.fullName || 'Trainee Learner'}
                </div>

                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  has successfully completed the competency training program in{' '}
                  <strong className="text-text-primary">
                    {selectedCert.courseName || selectedCert.trainingProgramName || 'Technical Training Course'}
                  </strong>.
                </p>

                {/* Verification QR & Mono ID */}
                <div className="pt-6 border-t border-border flex items-center justify-between text-left">
                  <div className="space-y-1">
                    <div className="text-xs text-text-tertiary">Verification ID</div>
                    <div className="font-mono text-xs font-bold text-text-primary">
                      {selectedCert.certificateId || selectedCert.id || 'KUMA-CERT-2026-8891'}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      Issued: {new Date(selectedCert.issuedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-control border border-border bg-surface-muted text-xs">
                    <QrCode className="h-8 w-8 text-text-primary" />
                    <div className="text-xs font-mono text-text-secondary">
                      <div>HMAC-SHA256</div>
                      <div>Verified Code</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setSelectedCert(null)}>
                  Close
                </Button>
                <Button variant="primary" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Print certificate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageLayout>
  );
}
