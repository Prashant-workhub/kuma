/**
 * Tests for certificate issuance and ID generation.
 *
 * Run with:  npm test
 *
 * Regression coverage for generateCertificateId(): the previous implementation
 * used `Math.random().toString(36).substring(2, 10)`, which can yield FEWER than
 * 8 characters (e.g. Math.random() === 0.5 produces "i"), yielding weak and
 * highly collision-prone IDs such as "KUMA-2026-I".
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type { TeacherAssignment, UserSettings } from '../../types';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  get length() {
    return this.store.size;
  }
}

(globalThis as unknown as { localStorage?: unknown }).localStorage = new MemoryStorage();

const { generateCertificateId, issueCertificateForCompletion, verifyCertificate, getAllCertificates } = await import(
  '../certificateUtils.ts'
);

let seq = 0;
function freshCourse() {
  seq += 1;
  return {
    id: `c-cert-${seq}`,
    courseCode: `CT${seq}`,
    courseName: `Course ${seq}`,
    competencyNames: ['Skill A'],
  } as unknown as TeacherAssignment;
}

/** Builds a distinct profile per call so certificates are not de-duplicated. */
function freshProfile() {
  seq += 1;
  return {
    fullName: 'Cert Test User',
    emailAddress: `cert${seq}@example.com`,
    bio: '',
    avatarUrl: '',
    institution: 'Test Institute',
    role: 'trainee',
    uid: `uid-cert-${seq}`,
  } as unknown as UserSettings['profile'];
}

test('generateCertificateId always returns 8 uppercase hex characters', () => {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5000; i++) {
    const id = generateCertificateId();
    assert.match(id, new RegExp(`^KUMA-${year}-[0-9A-F]{8}$`), `malformed certificate ID: ${id}`);
  }
});

test('generateCertificateId produces no collisions across many draws', () => {
  const seen = new Set<string>();
  const TOTAL = 50_000;
  for (let i = 0; i < TOTAL; i++) seen.add(generateCertificateId());

  // A birthday-paradox check: 8 hex chars = 2^32 space, so 50k draws should be
  // virtually collision-free. Allow a tiny margin rather than asserting zero.
  assert.ok(seen.size > TOTAL - 5, `unexpectedly low uniqueness: ${seen.size}/${TOTAL}`);
});

test('issueCertificateForCompletion issues one certificate per trainee per course', () => {
  const course = freshCourse();
  const profile = freshProfile();

  const first = issueCertificateForCompletion(profile, course, 'enr-1');
  const second = issueCertificateForCompletion(profile, course, 'enr-1');

  assert.equal(first.id, second.id, 'duplicate certificate must be prevented');
  assert.equal(getAllCertificates().filter((c) => c.courseId === course.id).length, 1);
});

test('issued certificates carry a matching verification URL and verify correctly', () => {
  const course = freshCourse();
  const profile = freshProfile();

  const cert = issueCertificateForCompletion(profile, course, 'enr-2');

  assert.equal(cert.verificationUrl, `/verify/certificate/${cert.id}`);
  assert.equal(cert.verified, true);
  assert.ok(cert.issueDate);
  assert.ok(cert.completionDate);

  const result = verifyCertificate(cert.id);
  assert.equal(result.isValid, true);
  assert.equal(result.certificate?.id, cert.id);
  assert.equal(result.certificate?.status, 'Valid');
});

test('verifyCertificate is case-insensitive and rejects unknown IDs', () => {
  const course = freshCourse();
  const profile = freshProfile();
  const cert = issueCertificateForCompletion(profile, course, 'enr-3');

  assert.equal(verifyCertificate(cert.id.toLowerCase()).isValid, true, 'lookup must be case-insensitive');
  assert.equal(verifyCertificate('KUMA-1999-DEADBEEF').isValid, false);
  assert.equal(verifyCertificate('').isValid, false);
});

test('issued certificate IDs do not collide with existing records', () => {
  const existing = getAllCertificates().map((c) => c.id.toUpperCase());
  const before = new Set(existing);

  // Issue many certificates for distinct courses; none may reuse an ID.
  for (let i = 0; i < 200; i++) {
    const cert = issueCertificateForCompletion(freshProfile(), freshCourse(), `enr-loop-${i}`);
    assert.equal(before.has(cert.id.toUpperCase()), false, `certificate ID reused: ${cert.id}`);
    before.add(cert.id.toUpperCase());
  }
});
