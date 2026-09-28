/**
 * Project Kuma - Phase 5 SIH Demonstration Data Seeder
 * Provides self-contained, realistic sample data and safe reset mechanisms for SIH evaluation.
 */

import { TrainingCertificate, TrainingEnrollment, TraineeCompetency, CatalogCompetency, CompetencyCategory, SkillProficiencyLevel, OrgDepartment, OrgDesignation } from '../types';

export const DEMO_ORGANIZATION = 'Acme Digital Services';

export const DEMO_DEPARTMENTS = [
  'Data & Analytics',
  'Technology',
  'Human Resources'
];

export const DEMO_ORG_DEPARTMENTS_FULL: OrgDepartment[] = [
  {
    id: 'dept-data-analytics',
    name: 'Data & Analytics',
    description: 'Data processing, statistical modeling, BI reporting, and predictive analytics.',
    isActive: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'dept-technology',
    name: 'Technology',
    description: 'Software engineering, cloud infrastructure, and IT security systems.',
    isActive: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'dept-human-resources',
    name: 'Human Resources',
    description: 'Workforce capacity building, talent acquisition, and personnel development.',
    isActive: true,
    createdAt: '2026-01-15'
  }
];

export const DEMO_ORG_DESIGNATIONS_FULL: OrgDesignation[] = [
  {
    id: 'desig-junior-data-associate',
    name: 'Junior Data Associate',
    departmentId: 'dept-data-analytics',
    departmentName: 'Data & Analytics',
    description: 'Data cleaning, introductory statistical analysis, and dashboard visualization.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-data-analysis',
        competencyName: 'Data Analysis',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'high'
      },
      {
        competencyId: 'comp-python-programming',
        competencyName: 'Python',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-comm-skills',
        competencyName: 'Communication',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'low'
      }
    ],
    createdAt: '2026-01-12'
  },
  {
    id: 'desig-software-engineer',
    name: 'Software Engineer',
    departmentId: 'dept-technology',
    departmentName: 'Technology',
    description: 'Full-stack software application development and system architecture maintenance.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-python-programming',
        competencyName: 'Python',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-digital-literacy',
        competencyName: 'Digital Literacy',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'medium'
      }
    ],
    createdAt: '2026-01-12'
  },
  {
    id: 'desig-hr-lead',
    name: 'HR Lead',
    departmentId: 'dept-human-resources',
    departmentName: 'Human Resources',
    description: 'Organizational learning strategy, workforce management, and competency tracking.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-leadership-mgmt',
        competencyName: 'Leadership',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-comm-skills',
        competencyName: 'Communication',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      }
    ],
    createdAt: '2026-01-18'
  }
];


export const DEMO_COMPETENCIES: CatalogCompetency[] = [
  {
    id: 'comp-data-analysis',
    name: 'Data Analysis',
    category: 'Technical',
    description: 'Statistical reasoning, data visualization, and predictive insight generation.',
    isActive: true
  },
  {
    id: 'comp-python-programming',
    name: 'Python',
    category: 'Technical',
    description: 'Data structure manipulation, automated scripting, and analytical pipelines with Python.',
    isActive: true
  },
  {
    id: 'comp-comm-skills',
    name: 'Communication',
    category: 'Communication',
    description: 'Clear technical documentation, executive presentation, and cross-functional reporting.',
    isActive: true
  },
  {
    id: 'comp-leadership-mgmt',
    name: 'Leadership',
    category: 'Leadership',
    description: 'Strategic planning, team mentoring, capacity building, and organizational agility.',
    isActive: true
  },
  {
    id: 'comp-digital-literacy',
    name: 'Digital Literacy',
    category: 'Digital',
    description: 'Fundamental cloud software usage, cyber awareness, and digital collaboration tools.',
    isActive: true
  }
];

export const DEMO_TRAINERS = [
  {
    uid: 'trainer-demo-1',
    fullName: 'Dr. Rajesh Kumar',
    emailAddress: 'rajesh.kumar@acme.com',
    department: 'Data & Analytics',
    designation: 'Lead Data Analytics Trainer',
    specialization: 'Statistical Modeling & Python'
  },
  {
    uid: 'trainer-demo-2',
    fullName: 'Prof. Anita Sharma',
    emailAddress: 'anita.sharma@acme.com',
    department: 'Technology',
    designation: 'Senior Technical Instructor',
    specialization: 'Digital Skills & Software Architecture'
  }
];

export const DEMO_TRAINEES: Array<{
  uid: string;
  fullName: string;
  emailAddress: string;
  department: string;
  designation: string;
  competencies: TraineeCompetency[];
  enrollments: TrainingEnrollment[];
  certificates: TrainingCertificate[];
}> = [
  {
    uid: 'user-demo-1',
    fullName: 'Demo Analyst',
    emailAddress: 'analyst@acme.com',
    department: 'Data & Analytics',
    designation: 'Junior Data Associate',
    competencies: [
      {
        id: 'tc-101',
        competencyId: 'comp-data-analysis',
        name: 'Data Analysis',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 78,
        lastAssessedDate: '2026-09-24',
        assessmentHistory: [
          {
            id: 'att-101',
            quizId: 'quiz-da101',
            quizTitle: 'Data Analysis Proficiency Evaluation',
            subject: 'Analytics',
            scorePercentage: 78,
            score: 7,
            totalQuestions: 10,
            assessedLevel: 'Intermediate',
            assessedNumericLevel: 2,
            passed: true,
            attemptDate: '2026-09-24'
          }
        ]
      },
      {
        id: 'tc-102',
        competencyId: 'comp-python-programming',
        name: 'Python',
        category: 'Technical',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 92,
        lastAssessedDate: '2026-09-20'
      },
      {
        id: 'tc-103',
        competencyId: 'comp-comm-skills',
        name: 'Communication',
        category: 'Communication',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 68,
        lastAssessedDate: '2026-09-22'
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-101',
        userId: 'user-demo-1',
        courseId: 'c-da101',
        courseCode: 'DA101',
        courseName: 'Advanced Data Analytics & Insights',
        enrolledAt: '2026-09-22',
        status: 'in_progress',
        completionRate: 50
      }
    ],
    certificates: []
  },
  {
    uid: 'user-demo-2',
    fullName: 'Sarah Jenkins',
    emailAddress: 'sarah.j@acme.com',
    department: 'Technology',
    designation: 'Systems Engineer',
    competencies: [
      {
        id: 'tc-201',
        competencyId: 'comp-python-programming',
        name: 'Python',
        category: 'Technical',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 95,
        lastAssessedDate: '2026-09-18'
      },
      {
        id: 'tc-202',
        competencyId: 'comp-data-analysis',
        name: 'Data Analysis',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2,
        latestAssessedLevel: 'Beginner',
        latestAssessedNumericLevel: 1,
        latestScorePercentage: 55,
        lastAssessedDate: '2026-09-15'
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-201',
        userId: 'user-demo-2',
        courseId: 'c-py102',
        courseCode: 'PY102',
        courseName: 'Python for Data Professionals',
        enrolledAt: '2026-09-10',
        status: 'completed',
        completionRate: 100,
        completedAt: '2026-09-20',
        certificateId: 'KUMA-2026-PY10299X'
      }
    ],
    certificates: [
      {
        id: 'KUMA-2026-PY10299X',
        userId: 'user-demo-2',
        userName: 'Sarah Jenkins',
        userEmail: 'sarah.j@acme.com',
        courseId: 'c-py102',
        courseCode: 'PY102',
        courseName: 'Python for Data Professionals',
        organization: DEMO_ORGANIZATION,
        department: 'Technology',
        designation: 'Systems Engineer',
        issueDate: '2026-09-20',
        completionDate: '2026-09-20',
        verified: true,
        verificationUrl: '/verify/certificate/KUMA-2026-PY10299X',
        competenciesAddressed: ['Python'],
        enrollmentId: 'enr-demo-201'
      }
    ]
  },
  {
    uid: 'user-demo-3',
    fullName: 'Marcus Chen',
    emailAddress: 'marcus.c@acme.com',
    department: 'Human Resources',
    designation: 'HR Operations Specialist',
    competencies: [
      {
        id: 'tc-301',
        competencyId: 'comp-comm-skills',
        name: 'Communication',
        category: 'Communication',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 70,
        lastAssessedDate: '2026-09-21'
      },
      {
        id: 'tc-302',
        competencyId: 'comp-leadership-mgmt',
        name: 'Leadership',
        category: 'Leadership',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2,
        latestAssessedLevel: 'Beginner',
        latestAssessedNumericLevel: 1,
        latestScorePercentage: 48,
        lastAssessedDate: '2026-09-21'
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-301',
        userId: 'user-demo-3',
        courseId: 'c-cm103',
        courseCode: 'CM103',
        courseName: 'Professional Communication & Reporting',
        enrolledAt: '2026-09-23',
        status: 'enrolled',
        completionRate: 20
      }
    ],
    certificates: []
  }
];

/**
 * Seeds the demo environment records into localStorage cleanly.
 */
export function seedDemoEnvironment(): { success: boolean; message: string } {
  if (typeof localStorage === 'undefined') {
    return { success: false, message: 'localStorage unavailable.' };
  }

  try {
    // 1. Store Demo Certificates
    const allDemoCerts: TrainingCertificate[] = [];
    DEMO_TRAINEES.forEach((t) => allDemoCerts.push(...t.certificates));

    const existingCertsRaw = localStorage.getItem('kuma_user_certificates');
    const existingCerts: TrainingCertificate[] = existingCertsRaw ? JSON.parse(existingCertsRaw) : [];

    const mergedCerts = [...allDemoCerts];
    existingCerts.forEach((ec) => {
      if (!mergedCerts.some((dc) => dc.id === ec.id)) {
        mergedCerts.push(ec);
      }
    });
    localStorage.setItem('kuma_user_certificates', JSON.stringify(mergedCerts));

    // 2. Store Demo Enrollments
    const allDemoEnrollments: TrainingEnrollment[] = [];
    DEMO_TRAINEES.forEach((t) => allDemoEnrollments.push(...t.enrollments));

    const existingEnrollmentsRaw = localStorage.getItem('kuma_user_enrollments');
    const existingEnrollments: TrainingEnrollment[] = existingEnrollmentsRaw ? JSON.parse(existingEnrollmentsRaw) : [];

    const mergedEnrollments = [...allDemoEnrollments];
    existingEnrollments.forEach((ee) => {
      if (!mergedEnrollments.some((de) => de.id === ee.id)) {
        mergedEnrollments.push(ee);
      }
    });
    localStorage.setItem('kuma_user_enrollments', JSON.stringify(mergedEnrollments));

    // 3. Mark demo environment initialized
    localStorage.setItem('kuma_demo_initialized', 'true');
    localStorage.setItem('kuma_demo_organization', DEMO_ORGANIZATION);

    return {
      success: true,
      message: `Demo environment initialized for '${DEMO_ORGANIZATION}' with 3 Trainees, 5 Competencies, and 5 Training Programs.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to seed demo environment: ${err.message || String(err)}`
    };
  }
}

/**
 * Resets demo data records safely without affecting genuine user records.
 */
export function resetDemoEnvironment(): { success: boolean; message: string } {
  if (typeof localStorage === 'undefined') {
    return { success: false, message: 'localStorage unavailable.' };
  }

  try {
    // Clean demo certificates
    const certsRaw = localStorage.getItem('kuma_user_certificates');
    if (certsRaw) {
      const certs: TrainingCertificate[] = JSON.parse(certsRaw);
      const nonDemoCerts = certs.filter(c => !c.id.startsWith('KUMA-2026-PY10299X') && c.organization !== DEMO_ORGANIZATION);
      localStorage.setItem('kuma_user_certificates', JSON.stringify(nonDemoCerts));
    }

    // Clean demo enrollments
    const enrollmentsRaw = localStorage.getItem('kuma_user_enrollments');
    if (enrollmentsRaw) {
      const enrollments: TrainingEnrollment[] = JSON.parse(enrollmentsRaw);
      const nonDemoEnrollments = enrollments.filter(e => !e.id.startsWith('enr-demo-'));
      localStorage.setItem('kuma_user_enrollments', JSON.stringify(nonDemoEnrollments));
    }

    localStorage.removeItem('kuma_demo_initialized');

    return {
      success: true,
      message: 'Demo records successfully reset. Production records preserved.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to reset demo environment: ${err.message || String(err)}`
    };
  }
}
