import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTrainingRecommendations } from '../recommendationUtils';
import { TraineeCompetency, TeacherAssignment, OrgDesignation } from '../../types';

test('getTrainingRecommendations ranks Critical priority gaps higher than Medium gaps', () => {
  const traineeCompetencies: TraineeCompetency[] = [
    { id: 'comp-react', name: 'React Development', level: 'Intermediate', numericLevel: 2, category: 'Technical' },
    { id: 'comp-python', name: 'Python Data Science', level: 'Beginner', numericLevel: 1, category: 'Technical' }
  ];

  const designation: OrgDesignation = {
    id: 'desig-frontend',
    name: 'Frontend Architect',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    isActive: true,
    requiredCompetencies: [
      { competencyId: 'comp-react', competencyName: 'React Development', requiredLevel: 'Expert', requiredNumericLevel: 4, priority: 'high' },
      { competencyId: 'comp-python', competencyName: 'Python Data Science', requiredLevel: 'Advanced', requiredNumericLevel: 3, priority: 'medium' }
    ]
  };

  const courses: TeacherAssignment[] = [
    {
      id: 'course-python',
      courseCode: 'PY-101',
      courseName: 'Python Mastery',
      competencyIds: ['comp-python'],
      competencyNames: ['Python Data Science'],
      isActive: true,
      students: 20,
      completionRate: 0,
      accent: 'cyan'
    },
    {
      id: 'course-react',
      courseCode: 'REACT-202',
      courseName: 'React Enterprise Architecture',
      competencyIds: ['comp-react'],
      competencyNames: ['React Development'],
      isActive: true,
      students: 45,
      completionRate: 0,
      accent: 'violet'
    }
  ];

  const res = getTrainingRecommendations(traineeCompetencies, courses, [], [], {}, designation);

  assert.equal(res.recommendedCourses.length, 2);
  // React course addresses Critical gap, Python addresses Medium gap -> React must be ranked #1
  assert.equal(res.recommendedCourses[0].course.id, 'course-react');
  assert.equal(res.recommendedCourses[0].highestPriority, 'Critical');
  assert.equal(res.recommendedCourses[1].course.id, 'course-python');
});
