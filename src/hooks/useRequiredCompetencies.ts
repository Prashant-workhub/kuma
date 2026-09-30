/**
 * Project Kuma - Trainee Required Competencies Hook
 * Resolves user's designation -> requiredCompetencies from Firestore (or seed fallback if empty).
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { OrgDesignation, DesignationCompetencyRequirement } from '../types';
import { DEMO_ORG_DESIGNATIONS_FULL, isDemoTraineeIdentity } from '../utils/demoDataSeeder';

export interface UseRequiredCompetenciesResult {
  requirements: DesignationCompetencyRequirement[];
  designation: OrgDesignation | null;
  loading: boolean;
  error: Error | null;
}

export function useRequiredCompetencies(user?: {
  uid?: string;
  emailAddress?: string;
  email?: string;
  designation?: string;
  department?: string;
  organization?: string;
} | null): UseRequiredCompetenciesResult {
  const [requirements, setRequirements] = useState<DesignationCompetencyRequirement[]>([]);
  const [designation, setDesignation] = useState<OrgDesignation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setRequirements([]);
      setDesignation(null);
      setLoading(false);
      return;
    }

    const email = user.emailAddress || user.email || '';
    const isDemo = isDemoTraineeIdentity(email) || user.uid === 'user-demo-1';
    const desigName = (user.designation || '').trim();

    if (!desigName) {
      setRequirements([]);
      setDesignation(null);
      setLoading(false);
      return;
    }

    if (!db || typeof db !== 'object' || Object.keys(db).length === 0) {
      // Standalone / offline fallback
      const demoMatch = DEMO_ORG_DESIGNATIONS_FULL.find(
        (d) => d.name.toLowerCase() === desigName.toLowerCase() || d.id === desigName
      );
      if (demoMatch) {
        setDesignation(demoMatch);
        setRequirements(demoMatch.requiredCompetencies || []);
      } else {
        setDesignation(null);
        setRequirements([]);
      }
      setLoading(false);
      return;
    }

    try {
      const unsub = onSnapshot(
        collection(db, 'designations'),
        (snapshot) => {
          const docs = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          } as OrgDesignation));

          // If collection is empty, fall back to seed dataset
          const listToSearch = docs.length > 0 ? docs : DEMO_ORG_DESIGNATIONS_FULL;

          let match = listToSearch.find(
            (d) => d.name.toLowerCase() === desigName.toLowerCase() || d.id === desigName
          );

          if (!match && isDemo) {
            match = DEMO_ORG_DESIGNATIONS_FULL.find(
              (d) => d.name.toLowerCase() === desigName.toLowerCase() || d.id === desigName
            );
          }

          if (match) {
            setDesignation(match);
            setRequirements(match.requiredCompetencies || []);
          } else {
            setDesignation(null);
            setRequirements([]);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('[useRequiredCompetencies] Firestore error:', err);
          const demoMatch = DEMO_ORG_DESIGNATIONS_FULL.find(
            (d) => d.name.toLowerCase() === desigName.toLowerCase() || d.id === desigName
          );
          if (demoMatch) {
            setDesignation(demoMatch);
            setRequirements(demoMatch.requiredCompetencies || []);
          }
          setError(err);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [user?.uid, user?.emailAddress, user?.email, user?.designation]);

  return { requirements, designation, loading, error };
}
