/**
 * Unit tests for designation competency requirements, skill gap calculation, and validation logic.
 *
 * Run with:  npx tsx --test src/utils/__tests__/competencyRequirements.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDesignationSkillGaps,
  calculateSkillGap,
  LEVEL_TO_NUMERIC
} from '../competencyUtils';
import type {
  OrgDesignation,
  TraineeCompetency,
  DesignationCompetencyRequirement
} from '../../types';
import { createDesignationInFirestore } from '../../services/adminDataService';

test('calculateDesignationSkillGaps uses Gap = Target - Max(Declared, Assessed)', () => {
  const reqs: DesignationCompetencyRequirement[] = [
    {
      competencyId: 'comp-react',
      competencyName: 'React Framework',
      requiredLevel: 'Expert',
      requiredNumericLevel: 4,
      priority: 'high'
    },
    {
      competencyId: 'comp-python',
      competencyName: 'Python Backend',
      requiredLevel: 'Advanced',
      requiredNumericLevel: 3,
      priority: 'medium'
    }
  ];

  const designation: OrgDesignation = {
    id: 'desig-sr-dev',
    name: 'Senior Developer',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    isActive: true,
    requiredCompetencies: reqs
  };

  // Trainee has Declared Level = Beginner (1), Assessed Level = Intermediate (2) for React
  // Max(Declared, Assessed) = 2. Target = 4. Gap = 4 - 2 = 2.
  const traineeCompetencies: TraineeCompetency[] = [
    {
      id: 'c1',
      competencyId: 'comp-react',
      name: 'React Framework',
      level: 'Beginner',
      numericLevel: 1,
      latestAssessedLevel: 'Intermediate',
      latestAssessedNumericLevel: 2
    },
    {
      id: 'c2',
      competencyId: 'comp-python',
      name: 'Python Backend',
      level: 'Advanced',
      numericLevel: 3
    }
  ];

  const result = calculateDesignationSkillGaps(traineeCompetencies, designation);

  assert.equal(result.length, 2);

  const reactGap = result.find((r) => r.competencyId === 'comp-react');
  assert.ok(reactGap);
  assert.equal(reactGap.currentNumericLevel, 2, 'Current level must be max(1, 2) = 2');
  assert.equal(reactGap.requiredNumericLevel, 4);
  assert.equal(reactGap.gap, 2, 'Gap must be Target(4) - Max(Declared, Assessed)(2) = 2');
  assert.equal(reactGap.currentSource, 'Assessed');

  const pythonGap = result.find((r) => r.competencyId === 'comp-python');
  assert.ok(pythonGap);
  assert.equal(pythonGap.currentNumericLevel, 3);
  assert.equal(pythonGap.requiredNumericLevel, 3);
  assert.equal(pythonGap.gap, 0);
});

test('createDesignationInFirestore rejects duplicate competency IDs in designation requirements', async () => {
  const reqsWithDuplicates: DesignationCompetencyRequirement[] = [
    {
      competencyId: 'comp-react',
      competencyName: 'React',
      requiredLevel: 'Advanced',
      requiredNumericLevel: 3
    },
    {
      competencyId: 'comp-react',
      competencyName: 'React Duplicate',
      requiredLevel: 'Expert',
      requiredNumericLevel: 4
    }
  ];

  await assert.rejects(
    async () => {
      await createDesignationInFirestore({
        name: 'Invalid Role',
        departmentId: 'dept-1',
        departmentName: 'Dept',
        isActive: true,
        requiredCompetencies: reqsWithDuplicates
      });
    },
    (err: Error) => {
      assert.match(err.message, /Duplicate competency in designation requirements/);
      return true;
    }
  );
});

test('createDesignationInFirestore rejects target levels outside 1-5', async () => {
  const invalidLevelReqs: any[] = [
    {
      competencyId: 'comp-sql',
      competencyName: 'SQL Databases',
      requiredLevel: 'Unknown',
      requiredNumericLevel: 6 // Invalid level > 5
    }
  ];

  await assert.rejects(
    async () => {
      await createDesignationInFirestore({
        name: 'Invalid Level Role',
        departmentId: 'dept-1',
        departmentName: 'Dept',
        isActive: true,
        requiredCompetencies: invalidLevelReqs
      });
    },
    (err: Error) => {
      assert.match(err.message, /Target level must be between 1 and 5/);
      return true;
    }
  );
});
