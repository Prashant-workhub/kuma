/**
 * Project Kuma - Admin & Organizational Structure Service
 * Manages Firestore & API persistence for organizations, departments, designations, and competencies.
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  query
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type {
  OrgDepartment,
  OrgDesignation,
  DesignationCompetencyRequirement,
  CatalogCompetency,
  Organization
} from '../types';

// ============================================================================
// FIRESTORE READ & SUBSCRIBE APIS
// ============================================================================

export function subscribeDepartments(
  onNext: (departments: OrgDepartment[]) => void,
  onError?: (err: Error) => void
) {
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) {
    onNext([]);
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, 'departments'),
      (snapshot) => {
        onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OrgDepartment)));
      },
      onError
    );
  } catch (e: any) {
    if (onError) onError(e);
    return () => {};
  }
}

export function subscribeDesignations(
  onNext: (designations: OrgDesignation[]) => void,
  onError?: (err: Error) => void
) {
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) {
    onNext([]);
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, 'designations'),
      (snapshot) => {
        onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OrgDesignation)));
      },
      onError
    );
  } catch (e: any) {
    if (onError) onError(e);
    return () => {};
  }
}

export function subscribeCompetencies(
  onNext: (competencies: CatalogCompetency[]) => void,
  onError?: (err: Error) => void
) {
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) {
    onNext([]);
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, 'competencyCatalog'),
      (snapshot) => {
        onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogCompetency)));
      },
      onError
    );
  } catch (e: any) {
    if (onError) onError(e);
    return () => {};
  }
}

// ============================================================================
// ADMIN CRUD OPERATIONS (Firestore + Server Validation)
// ============================================================================

export async function createDepartmentInFirestore(
  department: Omit<OrgDepartment, 'id'> & { id?: string }
): Promise<OrgDepartment> {
  if (!department.name || !department.name.trim()) {
    throw new Error('Department name is required.');
  }

  const id = department.id || `dept_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docData: OrgDepartment = {
    ...department,
    id,
    name: department.name.trim(),
    description: (department.description || '').trim(),
    isActive: department.isActive !== false,
    createdAt: department.createdAt || new Date().toISOString()
  };

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await setDoc(doc(db, 'departments', id), docData, { merge: true });
  }

  return docData;
}

export async function deleteDepartmentFromFirestore(id: string): Promise<void> {
  if (!id) return;
  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await deleteDoc(doc(db, 'departments', id));
  }
}

export async function createDesignationInFirestore(
  designation: Omit<OrgDesignation, 'id'> & { id?: string }
): Promise<OrgDesignation> {
  if (!designation.name || !designation.name.trim()) {
    throw new Error('Designation title/name is required.');
  }
  if (!designation.departmentId) {
    throw new Error('Department selection is required for a designation.');
  }

  // Validate required competencies
  if (Array.isArray(designation.requiredCompetencies)) {
    const seen = new Set<string>();
    for (const req of designation.requiredCompetencies) {
      if (seen.has(req.competencyId)) {
        throw new Error(`Duplicate competency in designation requirements: ${req.competencyName || req.competencyId}`);
      }
      seen.add(req.competencyId);
      const level = req.requiredNumericLevel || 1;
      if (level < 1 || level > 5) {
        throw new Error(`Target level must be between 1 and 5 (got ${level})`);
      }
    }
  }

  const id = designation.id || `desig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docData: OrgDesignation = {
    ...designation,
    id,
    name: designation.name.trim(),
    departmentId: designation.departmentId,
    departmentName: designation.departmentName || 'General',
    description: (designation.description || '').trim(),
    isActive: designation.isActive !== false,
    requiredCompetencies: designation.requiredCompetencies || [],
    createdAt: designation.createdAt || new Date().toISOString()
  };

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await setDoc(doc(db, 'designations', id), docData, { merge: true });
  }

  return docData;
}

export async function saveDesignationRequirementsInFirestore(
  designationId: string,
  requiredCompetencies: DesignationCompetencyRequirement[]
): Promise<void> {
  if (!designationId) throw new Error('Designation ID is required.');

  // Client-side validation before writing to Firestore
  const seen = new Set<string>();
  for (const req of requiredCompetencies) {
    if (seen.has(req.competencyId)) {
      throw new Error(`Duplicate competency in designation requirements: ${req.competencyName || req.competencyId}`);
    }
    seen.add(req.competencyId);
    const level = req.requiredNumericLevel || 1;
    if (level < 1 || level > 5) {
      throw new Error(`Target level must be between 1 and 5 (got ${level})`);
    }
  }

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await setDoc(
      doc(db, 'designations', designationId),
      { requiredCompetencies, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  }
}

export async function deleteDesignationFromFirestore(id: string): Promise<void> {
  if (!id) return;
  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await deleteDoc(doc(db, 'designations', id));
  }
}

export async function createCatalogCompetencyInFirestore(
  competency: Omit<CatalogCompetency, 'id'> & { id?: string }
): Promise<CatalogCompetency> {
  if (!competency.name || !competency.name.trim()) {
    throw new Error('Competency name is required.');
  }

  const id = competency.id || `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docData: CatalogCompetency = {
    ...competency,
    id,
    name: competency.name.trim(),
    category: competency.category || 'Technical',
    description: (competency.description || '').trim(),
    isActive: competency.isActive !== false
  };

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await setDoc(doc(db, 'competencyCatalog', id), docData, { merge: true });
  }

  return docData;
}

export async function deleteCatalogCompetencyFromFirestore(id: string): Promise<void> {
  if (!id) return;
  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    await deleteDoc(doc(db, 'competencyCatalog', id));
  }
}
