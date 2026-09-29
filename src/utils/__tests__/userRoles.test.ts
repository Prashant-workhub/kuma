import assert from 'node:assert/strict';
import { test } from 'node:test';
import { portalRoleFromProfile } from '../userRoles';

test('portal roles are derived from persisted role values', () => {
  assert.equal(portalRoleFromProfile('admin'), 'admin');
  assert.equal(portalRoleFromProfile('trainer'), 'faculty');
  assert.equal(portalRoleFromProfile('teacher'), 'faculty');
  assert.equal(portalRoleFromProfile('trainee'), 'student');
});

test('unknown profile roles are rejected instead of guessed', () => {
  assert.equal(portalRoleFromProfile('owner'), null);
  assert.equal(portalRoleFromProfile(undefined), null);
});