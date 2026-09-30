import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

const CERT_SIGNING_SECRET = process.env.CERT_SIGNING_SECRET || 'kuma-secret-signing-key-dev-mode';

function computeCertificateSignature(certData: any): string {
  const canonicalString = [
    certData.certId || certData.id || '',
    certData.uid || '',
    certData.courseId || '',
    certData.traineeName || '',
    certData.orgId || certData.organization || '',
    certData.issuedAt || certData.issueDate || ''
  ].join('|');
  return crypto.createHmac('sha256', CERT_SIGNING_SECRET).update(canonicalString).digest('hex');
}

function verifySignature(certData: any): boolean {
  if (!certData || !certData.signature) return false;
  const expectedSig = computeCertificateSignature(certData);
  return certData.signature === expectedSig;
}

test('computeCertificateSignature creates a non-empty HMAC-SHA256 hex string', () => {
  const cert = {
    certId: 'KUMA-CERT-12345-ABC',
    uid: 'user-trainee-101',
    courseId: 'c-da101',
    traineeName: 'Aarav Sharma',
    orgId: 'Ministry of Skill Development',
    issuedAt: '2026-09-30T12:00:00.000Z'
  };

  const sig = computeCertificateSignature(cert);
  assert.ok(sig);
  assert.equal(typeof sig, 'string');
  assert.equal(sig.length, 64, 'HMAC-SHA256 hex string must be 64 characters long');
});

test('signature verification passes for untampered valid certificate record', () => {
  const cert = {
    certId: 'KUMA-CERT-12345-ABC',
    uid: 'user-trainee-101',
    courseId: 'c-da101',
    traineeName: 'Aarav Sharma',
    orgId: 'Ministry of Skill Development',
    issuedAt: '2026-09-30T12:00:00.000Z',
    status: 'valid'
  };

  const signature = computeCertificateSignature(cert);
  const certWithSig = { ...cert, signature };

  assert.equal(verifySignature(certWithSig), true, 'Valid cert signature verification must pass');
});

test('tampering with traineeName causes signature verification to fail', () => {
  const original = {
    certId: 'KUMA-CERT-12345-ABC',
    uid: 'user-trainee-101',
    courseId: 'c-da101',
    traineeName: 'Aarav Sharma',
    orgId: 'Ministry of Skill Development',
    issuedAt: '2026-09-30T12:00:00.000Z'
  };

  const signature = computeCertificateSignature(original);
  const tampered = { ...original, signature, traineeName: 'Fraudulent Name' };

  assert.equal(verifySignature(tampered), false, 'Tampered traineeName must fail signature verification');
});

test('tampering with orgId or courseId causes signature verification to fail', () => {
  const original = {
    certId: 'KUMA-CERT-12345-ABC',
    uid: 'user-trainee-101',
    courseId: 'c-da101',
    traineeName: 'Aarav Sharma',
    orgId: 'Ministry of Skill Development',
    issuedAt: '2026-09-30T12:00:00.000Z'
  };

  const signature = computeCertificateSignature(original);
  const tamperedOrg = { ...original, signature, orgId: 'Unapproved Fake Org' };
  const tamperedCourse = { ...original, signature, courseId: 'c-fake-999' };

  assert.equal(verifySignature(tamperedOrg), false, 'Tampered orgId must fail signature verification');
  assert.equal(verifySignature(tamperedCourse), false, 'Tampered courseId must fail signature verification');
});

test('tampering with the signature itself causes verification to fail', () => {
  const original = {
    certId: 'KUMA-CERT-12345-ABC',
    uid: 'user-trainee-101',
    courseId: 'c-da101',
    traineeName: 'Aarav Sharma',
    orgId: 'Ministry of Skill Development',
    issuedAt: '2026-09-30T12:00:00.000Z',
    signature: 'bad0000000000000000000000000000000000000000000000000000000000000'
  };

  assert.equal(verifySignature(original), false, 'Forged signature must fail verification');
});
