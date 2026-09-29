import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isDemoTraineeIdentity, isDemoTrainerIdentity } from '../demoDataSeeder';

test('demo trainee identity accepts explicit demo UIDs and emails', () => {
  assert.equal(isDemoTraineeIdentity('trainee-judge-demo'), true);
  assert.equal(isDemoTraineeIdentity('', 'AARAV.SHARMA@CAPACITYCONNECT.IN'), true);
});

test('demo trainee identity rejects real, generic, and missing identities', () => {
  assert.equal(isDemoTraineeIdentity('firebase-user-123', 'person@example.org'), false);
  assert.equal(isDemoTraineeIdentity('', 'trainee@organization.gov.in'), false);
  assert.equal(isDemoTraineeIdentity(), false);
});

test('demo trainer data is limited to explicit demo identities', () => {
  assert.equal(isDemoTrainerIdentity('', 'TRAINER@ACME.COM'), true);
  assert.equal(isDemoTrainerIdentity('firebase-user-123', 'person@example.org'), false);
});