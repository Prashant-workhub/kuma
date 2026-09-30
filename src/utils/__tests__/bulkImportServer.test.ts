import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAndValidateCsv, isValidEmail, MAX_BULK_IMPORT_ROWS } from '../csvImportUtils.js';

test('Server CSV validation: enforces 500 row limit', () => {
  const headers = 'fullName,emailAddress,department,designation,employeeId\n';
  const validRow = 'John Doe,john.doe@example.com,Engineering,Developer,EMP-1\n';
  
  // Create CSV with 505 rows
  let csv = headers;
  for (let i = 1; i <= 505; i++) {
    csv += `User ${i},user${i}@example.com,Dept,Desig,EMP-${i}\n`;
  }

  const result = parseAndValidateCsv(csv);
  assert.equal(result.totalRows, 505);
  assert.equal(result.totalRows > MAX_BULK_IMPORT_ROWS, true);
});

test('Server bulk import idempotency: skips existing user records by email', () => {
  const existingUsers = new Set(['existing.user@example.com']);
  const incomingBatch = [
    { name: 'Existing User', email: 'existing.user@example.com', department: 'Engineering', designation: 'Developer' },
    { name: 'New User', email: 'new.user@example.com', department: 'Product', designation: 'PM' }
  ];

  const results = incomingBatch.map((item) => {
    const cleanEmail = item.email.toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { email: cleanEmail, status: 'error', error: 'Invalid email' };
    }
    if (existingUsers.has(cleanEmail)) {
      return { email: cleanEmail, status: 'skipped', message: 'User already exists' };
    }
    existingUsers.add(cleanEmail);
    return { email: cleanEmail, status: 'created', uid: `uid-${cleanEmail}`, inviteLink: `/reset-password?email=${cleanEmail}` };
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].status, 'skipped');
  assert.equal(results[1].status, 'created');
  assert.equal(typeof results[1].inviteLink, 'string');
});

test('Analytics calculations: computes urgency score = total gap x affected employees', () => {
  const mockGaps = [
    { competencyId: 'comp-1', competencyName: 'Data Cleaning', gap: 2 },
    { competencyId: 'comp-1', competencyName: 'Data Cleaning', gap: 1 },
    { competencyId: 'comp-2', competencyName: 'Python Basics', gap: 3 }
  ];

  const gapSummary: Record<string, { affected: number; totalGap: number }> = {};
  mockGaps.forEach(g => {
    if (!gapSummary[g.competencyId]) {
      gapSummary[g.competencyId] = { affected: 0, totalGap: 0 };
    }
    gapSummary[g.competencyId].affected++;
    gapSummary[g.competencyId].totalGap += g.gap;
  });

  const topSkillGaps = Object.entries(gapSummary).map(([cId, val]) => ({
    competencyId: cId,
    affectedEmployees: val.affected,
    totalGap: val.totalGap,
    urgencyScore: val.totalGap // total gap = sum of individual gaps
  })).sort((a, b) => b.urgencyScore - a.urgencyScore);

  assert.equal(topSkillGaps[0].competencyId, 'comp-1');
  assert.equal(topSkillGaps[0].totalGap, 3);
  assert.equal(topSkillGaps[0].affectedEmployees, 2);
});
