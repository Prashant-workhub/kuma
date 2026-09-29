/**
 * Project Kuma - SIH Demonstration Data Seeder & Environment Management
 * SIH Problem Statement: SIH26075 — "CAPACITY CONNECT: A Digital Capacity Building and Learning Management Portal"
 *
 * Provides self-contained, realistic SIH judge demonstration data and safe reset mechanisms.
 */

import { TrainingCertificate, TrainingEnrollment, TraineeCompetency, CatalogCompetency, OrgDepartment, OrgDesignation, Quiz } from '../types';
import { TeacherAssignment } from '../teacher-portal/types';

export const DEMO_ORGANIZATION = 'Capacity Connect Demo Organization';

export function isDemoTraineeIdentity(uid?: string, email?: string): boolean {
  const demoUids = new Set(['user-demo-1', 'trainee-demo-aarav', 'trainee-judge-demo']);
  const demoEmails = new Set(['aarav.sharma@capacityconnect.in', 'guest.student@kuma.ai']);
  return demoUids.has(uid || '') || demoEmails.has((email || '').trim().toLowerCase());
}

export function isDemoTrainerIdentity(uid?: string, email?: string): boolean {
  return uid === 'faculty-1' || (email || '').trim().toLowerCase() === 'trainer@acme.com';
}

export const DEMO_DEPARTMENTS = [
  'Engineering',
  'Data & Analytics',
  'Human Resources'
];

export const DEMO_ORG_DEPARTMENTS_FULL: OrgDepartment[] = [
  {
    id: 'dept-eng',
    name: 'Engineering',
    description: 'Software development, frontend architecture, backend microservices, and DevOps.',
    isActive: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'dept-data-analytics',
    name: 'Data & Analytics',
    description: 'Statistical modeling, database administration, BI dashboards, and data pipelines.',
    isActive: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'dept-hr',
    name: 'Human Resources',
    description: 'Workforce capacity building, talent assessment, and personnel growth planning.',
    isActive: true,
    createdAt: '2026-01-15'
  }
];

export const DEMO_ORG_DESIGNATIONS_FULL: OrgDesignation[] = [
  {
    id: 'desig-software-dev',
    name: 'Software Developer',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    description: 'Full-stack software application development, web components, and backend service integration.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-react',
        competencyName: 'React',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-js',
        competencyName: 'JavaScript',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-node',
        competencyName: 'Node.js',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-db',
        competencyName: 'Database Management',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-git',
        competencyName: 'Git & Version Control',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-problem-solving',
        competencyName: 'Problem Solving',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      }
    ],
    createdAt: '2026-01-12'
  },
  {
    id: 'desig-frontend-dev',
    name: 'Frontend Developer',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    description: 'User interface implementation, responsive layouts, web accessibility, and client state.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-js',
        competencyName: 'JavaScript',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-react',
        competencyName: 'React',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-git',
        competencyName: 'Git & Version Control',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-comm',
        competencyName: 'Communication',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'low'
      }
    ],
    createdAt: '2026-01-12'
  },
  {
    id: 'desig-data-analyst',
    name: 'Data Analyst',
    departmentId: 'dept-data-analytics',
    departmentName: 'Data & Analytics',
    description: 'Exploratory data analysis, SQL query formulation, and business intelligence reporting.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-data-analysis',
        competencyName: 'Data Analysis',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-db',
        competencyName: 'Database Management',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-comm',
        competencyName: 'Communication',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-problem-solving',
        competencyName: 'Problem Solving',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      }
    ],
    createdAt: '2026-01-15'
  },
  {
    id: 'desig-data-scientist',
    name: 'Data Scientist',
    departmentId: 'dept-data-analytics',
    departmentName: 'Data & Analytics',
    description: 'Predictive statistical models, machine learning pipelines, and advanced analytics.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-data-analysis',
        competencyName: 'Data Analysis',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-js',
        competencyName: 'JavaScript',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      },
      {
        competencyId: 'comp-db',
        competencyName: 'Database Management',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-problem-solving',
        competencyName: 'Problem Solving',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      }
    ],
    createdAt: '2026-01-16'
  },
  {
    id: 'desig-hr-exec',
    name: 'HR Executive',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    description: 'Workforce capacity building, talent mapping, and corporate training management.',
    isActive: true,
    requiredCompetencies: [
      {
        competencyId: 'comp-comm',
        competencyName: 'Communication',
        requiredLevel: 'Advanced',
        requiredNumericLevel: 3,
        priority: 'high'
      },
      {
        competencyId: 'comp-problem-solving',
        competencyName: 'Problem Solving',
        requiredLevel: 'Intermediate',
        requiredNumericLevel: 2,
        priority: 'medium'
      }
    ],
    createdAt: '2026-01-18'
  }
];

export const DEMO_COMPETENCIES: CatalogCompetency[] = [
  {
    id: 'comp-react',
    name: 'React',
    category: 'Technical',
    description: 'Component lifecycle, custom hooks, context state management, and virtual DOM performance.',
    isActive: true
  },
  {
    id: 'comp-js',
    name: 'JavaScript',
    category: 'Technical',
    description: 'Modern ES6+ syntax, asynchronous control flow, promises, and functional programming.',
    isActive: true
  },
  {
    id: 'comp-node',
    name: 'Node.js',
    category: 'Technical',
    description: 'Server-side runtime, Express framework, REST API design, and asynchronous I/O handling.',
    isActive: true
  },
  {
    id: 'comp-db',
    name: 'Database Management',
    category: 'Technical',
    description: 'Relational data modeling, SQL query formulation, indexing, and transaction ACID properties.',
    isActive: true
  },
  {
    id: 'comp-git',
    name: 'Git & Version Control',
    category: 'Technical',
    description: 'Branching strategies, interactive rebase, pull requests, and merge conflict resolution.',
    isActive: true
  },
  {
    id: 'comp-data-analysis',
    name: 'Data Analysis',
    category: 'Technical',
    description: 'Statistical summary, data hygiene, exploratory visualization, and insight generation.',
    isActive: true
  },
  {
    id: 'comp-comm',
    name: 'Communication',
    category: 'Communication',
    description: 'Clear technical documentation, cross-functional reporting, and stakeholder messaging.',
    isActive: true
  },
  {
    id: 'comp-problem-solving',
    name: 'Problem Solving',
    category: 'Leadership',
    description: 'Algorithmic reasoning, root-cause analysis, structured issue diagnosis, and solution design.',
    isActive: true
  }
];

export const DEMO_TRAINERS = [
  {
    uid: 'trainer-demo-alex',
    fullName: 'Alex Rivera',
    emailAddress: 'alex.rivera@capacityconnect.in',
    department: 'Engineering',
    designation: 'Senior Software Development Trainer',
    specialization: 'React, Node.js & Full-Stack Systems'
  },
  {
    uid: 'trainer-demo-rajesh',
    fullName: 'Dr. Rajesh Kumar',
    emailAddress: 'rajesh.kumar@capacityconnect.in',
    department: 'Data & Analytics',
    designation: 'Lead Data Analytics Trainer',
    specialization: 'Statistical Modeling, SQL & Data Pipelines'
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
  // 1. PRIMARY JUDGE DEMO TRAINEE (Believable React gap ready for full 10-step flow)
  {
    uid: 'trainee-judge-demo',
    fullName: 'Aarav Sharma (Primary Demo Trainee)',
    emailAddress: 'aarav.sharma@capacityconnect.in',
    department: 'Engineering',
    designation: 'Software Developer',
    competencies: [
      {
        id: 'tc-judge-react',
        competencyId: 'comp-react',
        name: 'React',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        description: 'Component lifecycle, custom hooks, and state management.'
      },
      {
        id: 'tc-judge-js',
        competencyId: 'comp-js',
        name: 'JavaScript',
        category: 'Technical',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 88,
        lastAssessedDate: '2026-09-20'
      },
      {
        id: 'tc-judge-node',
        competencyId: 'comp-node',
        name: 'Node.js',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2
      },
      {
        id: 'tc-judge-git',
        competencyId: 'comp-git',
        name: 'Git & Version Control',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2
      },
      {
        id: 'tc-judge-db',
        competencyId: 'comp-db',
        name: 'Database Management',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 75,
        lastAssessedDate: '2026-09-18'
      },
      {
        id: 'tc-judge-ps',
        competencyId: 'comp-problem-solving',
        name: 'Problem Solving',
        category: 'Leadership',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 90,
        lastAssessedDate: '2026-09-22'
      }
    ],
    enrollments: [],
    certificates: []
  },

  // 2. TRAINEE A (Significant Gaps)
  {
    uid: 'trainee-demo-priya',
    fullName: 'Priya Patel (Significant Gaps)',
    emailAddress: 'priya.patel@capacityconnect.in',
    department: 'Engineering',
    designation: 'Software Developer',
    competencies: [
      {
        id: 'tc-priya-react',
        competencyId: 'comp-react',
        name: 'React',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Advanced',
        targetNumericLevel: 3
      },
      {
        id: 'tc-priya-js',
        competencyId: 'comp-js',
        name: 'JavaScript',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Advanced',
        targetNumericLevel: 3
      },
      {
        id: 'tc-priya-node',
        competencyId: 'comp-node',
        name: 'Node.js',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2
      },
      {
        id: 'tc-priya-git',
        competencyId: 'comp-git',
        name: 'Git & Version Control',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 72,
        lastAssessedDate: '2026-09-24'
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-priya-101',
        userId: 'trainee-demo-priya',
        courseId: 'c-react101',
        courseCode: 'REACT101',
        courseName: 'Advanced React Development',
        enrolledAt: '2026-09-25',
        status: 'enrolled',
        completionRate: 0
      },
      {
        id: 'enr-demo-priya-102',
        userId: 'trainee-demo-priya',
        courseId: 'c-js101',
        courseCode: 'JS101',
        courseName: 'Modern JavaScript Development',
        enrolledAt: '2026-09-22',
        status: 'in_progress',
        completionRate: 40
      }
    ],
    certificates: []
  },

  // 3. TRAINEE B (Moderate Gaps)
  {
    uid: 'trainee-demo-rohan',
    fullName: 'Rohan Verma (Moderate Gaps)',
    emailAddress: 'rohan.verma@capacityconnect.in',
    department: 'Engineering',
    designation: 'Software Developer',
    competencies: [
      {
        id: 'tc-rohan-react',
        competencyId: 'comp-react',
        name: 'React',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Advanced',
        targetNumericLevel: 3
      },
      {
        id: 'tc-rohan-js',
        competencyId: 'comp-js',
        name: 'JavaScript',
        category: 'Technical',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 91,
        lastAssessedDate: '2026-09-19'
      },
      {
        id: 'tc-rohan-git',
        competencyId: 'comp-git',
        name: 'Git & Version Control',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-rohan-101',
        userId: 'trainee-demo-rohan',
        courseId: 'c-git101',
        courseCode: 'GIT101',
        courseName: 'Git & Version Control Mastery',
        enrolledAt: '2026-09-21',
        status: 'in_progress',
        completionRate: 60
      }
    ],
    certificates: []
  },

  // 4. TRAINEE C (Meets Requirements)
  {
    uid: 'trainee-demo-neha',
    fullName: 'Neha Gupta (Meets Requirements)',
    emailAddress: 'neha.gupta@capacityconnect.in',
    department: 'Engineering',
    designation: 'Software Developer',
    competencies: [
      {
        id: 'tc-neha-react',
        competencyId: 'comp-react',
        name: 'React',
        category: 'Technical',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 94,
        lastAssessedDate: '2026-09-20'
      },
      {
        id: 'tc-neha-js',
        competencyId: 'comp-js',
        name: 'JavaScript',
        category: 'Technical',
        level: 'Advanced',
        numericLevel: 3,
        targetLevel: 'Advanced',
        targetNumericLevel: 3,
        latestAssessedLevel: 'Advanced',
        latestAssessedNumericLevel: 3,
        latestScorePercentage: 96,
        lastAssessedDate: '2026-09-18'
      },
      {
        id: 'tc-neha-git',
        competencyId: 'comp-git',
        name: 'Git & Version Control',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 85,
        lastAssessedDate: '2026-09-15'
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-neha-101',
        userId: 'trainee-demo-neha',
        courseId: 'c-js101',
        courseCode: 'JS101',
        courseName: 'Modern JavaScript Development',
        enrolledAt: '2026-09-10',
        status: 'completed',
        completionRate: 100,
        completedAt: '2026-09-18',
        certificateId: 'KUMA-2026-JS-002'
      }
    ],
    certificates: [
      {
        id: 'KUMA-2026-JS-002',
        userId: 'trainee-demo-neha',
        userName: 'Neha Gupta',
        userEmail: 'neha.gupta@capacityconnect.in',
        courseId: 'c-js101',
        courseCode: 'JS101',
        courseName: 'Modern JavaScript Development',
        organization: DEMO_ORGANIZATION,
        department: 'Engineering',
        designation: 'Software Developer',
        issueDate: '2026-09-18',
        completionDate: '2026-09-18',
        verified: true,
        verificationUrl: '/verify/certificate/KUMA-2026-JS-002',
        competenciesAddressed: ['JavaScript'],
        enrollmentId: 'enr-demo-neha-101'
      }
    ]
  },

  // 5. DATA ANALYST TRAINEE
  {
    uid: 'trainee-demo-vikram',
    fullName: 'Vikram Singh (Data Analyst Trainee)',
    emailAddress: 'vikram.singh@capacityconnect.in',
    department: 'Data & Analytics',
    designation: 'Data Analyst',
    competencies: [
      {
        id: 'tc-vikram-da',
        competencyId: 'comp-data-analysis',
        name: 'Data Analysis',
        category: 'Technical',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Advanced',
        targetNumericLevel: 3
      },
      {
        id: 'tc-vikram-db',
        competencyId: 'comp-db',
        name: 'Database Management',
        category: 'Technical',
        level: 'Beginner',
        numericLevel: 1,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2
      },
      {
        id: 'tc-vikram-comm',
        competencyId: 'comp-comm',
        name: 'Communication',
        category: 'Communication',
        level: 'Intermediate',
        numericLevel: 2,
        targetLevel: 'Intermediate',
        targetNumericLevel: 2,
        latestAssessedLevel: 'Intermediate',
        latestAssessedNumericLevel: 2,
        latestScorePercentage: 78,
        lastAssessedDate: '2026-09-22'
      }
    ],
    enrollments: [
      {
        id: 'enr-demo-vikram-101',
        userId: 'trainee-demo-vikram',
        courseId: 'c-da101',
        courseCode: 'DA101',
        courseName: 'Data Analytics Foundations',
        enrolledAt: '2026-09-20',
        status: 'in_progress',
        completionRate: 50
      }
    ],
    certificates: []
  }
];

export const DEMO_COURSES: TeacherAssignment[] = [
  {
    id: 'c-react101',
    courseCode: 'REACT101',
    courseName: 'Advanced React Development',
    subject: 'Frontend Development',
    semester: 'Fall 2026',
    students: 45,
    completionRate: 55,
    accent: 'gold',
    description: 'Deep dive into React component lifecycle, custom hooks, context management, performance optimization, and modular UI state.',
    duration: '4 weeks (16 hours)',
    isActive: true,
    competencyIds: ['comp-react'],
    competencyNames: ['React'],
    syllabus: [
      { id: 's1', title: 'React Component Lifecycle & Custom Hooks', done: true },
      { id: 's2', title: 'State Management & Context API Architecture', done: true },
      { id: 's3', title: 'Performance Optimization, Memoization & Lazy Loading', done: false },
      { id: 's4', title: 'Modular UI Design System & Component Testing', done: false }
    ]
  },
  {
    id: 'c-js101',
    courseCode: 'JS101',
    courseName: 'Modern JavaScript Development',
    subject: 'Web Technologies',
    semester: 'Fall 2026',
    students: 62,
    completionRate: 80,
    accent: 'cyan',
    description: 'Advanced ES6+ syntax, Promises, Async/Await, closures, event loop internals, and modern JS tooling.',
    duration: '3 weeks (12 hours)',
    isActive: true,
    competencyIds: ['comp-js'],
    competencyNames: ['JavaScript'],
    syllabus: [
      { id: 's1', title: 'ES6+ Syntax, Destructuring & Arrow Functions', done: true },
      { id: 's2', title: 'Asynchronous JavaScript: Promises & Async/Await', done: true },
      { id: 's3', title: 'Event Loop Internals, Closures & Scope Chains', done: true }
    ]
  },
  {
    id: 'c-node101',
    courseCode: 'NODE101',
    courseName: 'Node.js Backend Development',
    subject: 'Backend Systems',
    semester: 'Fall 2026',
    students: 38,
    completionRate: 42,
    accent: 'emerald',
    description: 'Building robust REST APIs with Node.js and Express, middleware patterns, authentication, and error handling.',
    duration: '4 weeks (16 hours)',
    isActive: true,
    competencyIds: ['comp-node'],
    competencyNames: ['Node.js'],
    syllabus: [
      { id: 's1', title: 'Node.js Event Loop & Module System', done: false },
      { id: 's2', title: 'Express Server Setup & REST Routing', done: false },
      { id: 's3', title: 'Middleware Pipeline & Validation Rules', done: false },
      { id: 's4', title: 'Error Handling & Enterprise Security Best Practices', done: false }
    ]
  },
  {
    id: 'c-git101',
    courseCode: 'GIT101',
    courseName: 'Git & Version Control Mastery',
    subject: 'Software Engineering',
    semester: 'Fall 2026',
    students: 50,
    completionRate: 60,
    accent: 'violet',
    description: 'Advanced branching strategies, interactive rebase, staging workflows, and merge conflict resolution.',
    duration: '2 weeks (8 hours)',
    isActive: true,
    competencyIds: ['comp-git'],
    competencyNames: ['Git & Version Control'],
    syllabus: [
      { id: 's1', title: 'Git Internals, Commits & Staging Index', done: true },
      { id: 's2', title: 'Branching Strategies & Pull Request Workflows', done: false },
      { id: 's3', title: 'Interactive Rebase & Conflict Resolution', done: false }
    ]
  },
  {
    id: 'c-db101',
    courseCode: 'DB101',
    courseName: 'Database Fundamentals & SQL',
    subject: 'Database Management',
    semester: 'Fall 2026',
    students: 70,
    completionRate: 75,
    accent: 'rose',
    description: 'Relational data modeling, SQL queries, join optimization, indexes, normalization, and ACID properties.',
    duration: '4 weeks (16 hours)',
    isActive: true,
    competencyIds: ['comp-db'],
    competencyNames: ['Database Management'],
    syllabus: [
      { id: 's1', title: 'Relational Data Modeling & ER Diagrams', done: true },
      { id: 's2', title: 'Complex SQL Queries & Multi-Table Joins', done: true },
      { id: 's3', title: 'Indexing Optimization & B+ Trees', done: false }
    ]
  },
  {
    id: 'c-da101',
    courseCode: 'DA101',
    courseName: 'Data Analytics Foundations',
    subject: 'Data Analysis',
    semester: 'Fall 2026',
    students: 85,
    completionRate: 50,
    accent: 'emerald',
    description: 'Statistical summary, data hygiene, exploratory data analysis, chart visualization, and executive reporting.',
    duration: '4 weeks (16 hours)',
    isActive: true,
    competencyIds: ['comp-data-analysis'],
    competencyNames: ['Data Analysis'],
    syllabus: [
      { id: 's1', title: 'Data Cleaning & Hygiene Aggregation', done: true },
      { id: 's2', title: 'Statistical Distributions & Exploratory Charting', done: false },
      { id: 's3', title: 'Predictive Modeling & Reporting Dashboards', done: false }
    ]
  }
];

export const DEMO_QUIZZES: Quiz[] = [
  {
    id: 'quiz-react101',
    title: 'React Advanced Competency Evaluation',
    courseCode: 'REACT101',
    courseName: 'Advanced React Development',
    topic: 'React Architecture & Custom Hooks',
    competencyId: 'comp-react',
    competencyName: 'React',
    passingScore: 70,
    estimatedTime: '15 mins',
    questionsCount: 5,
    status: 'available',
    questions: [
      {
        id: 'q-react-1',
        question: 'What is the primary benefit of custom React hooks?',
        options: [
          'They replace the Virtual DOM rendering pipeline',
          'They allow reusability of stateful logic across multiple components',
          'They convert functional components into class components',
          'They automatically cache all API network requests'
        ],
        correctAnswerIndex: 1,
        explanation: 'Custom hooks isolate stateful logic so it can be shared across multiple components without altering component hierarchy.'
      },
      {
        id: 'q-react-2',
        question: 'Which hook should be used to memoize expensive computations between component renders?',
        options: [
          'useEffect',
          'useCallback',
          'useMemo',
          'useRef'
        ],
        correctAnswerIndex: 2,
        explanation: 'useMemo returns a memoized value that is recomputed only when one of its specified dependencies changes.'
      },
      {
        id: 'q-react-3',
        question: 'How does React determine when to re-render a component wrapped in React.memo?',
        options: [
          'By performing a shallow comparison of current and previous props',
          'By deep-comparing every nested prop object',
          'By triggering a timer every 100 milliseconds',
          'By checking if parent state has mutated'
        ],
        correctAnswerIndex: 0,
        explanation: 'React.memo performs a shallow comparison of props by default to skip unnecessary re-renders.'
      },
      {
        id: 'q-react-4',
        question: 'Why should useEffect cleanup functions return a teardown function?',
        options: [
          'To force the component to throw an unmount error',
          'To unsubscribe from subscriptions, timers, or event listeners before re-execution or unmounting',
          'To save state to browser localStorage automatically',
          'To compile JavaScript to native WebAssembly code'
        ],
        correctAnswerIndex: 1,
        explanation: 'Cleanup functions prevent memory leaks by clearing timers, sockets, or event listeners.'
      },
      {
        id: 'q-react-5',
        question: 'What is the recommended rule of thumb regarding the Context API in large React applications?',
        options: [
          'Context should store every local component state',
          'Context should be used for low-frequency global state (e.g. theme, auth) to prevent broad re-renders',
          'Context can only store plain string values',
          'Context replaces Redux and state management entirely without drawbacks'
        ],
        correctAnswerIndex: 1,
        explanation: 'Context triggers re-renders on all consuming components, so high-frequency state updates should be managed carefully.'
      }
    ]
  },
  {
    id: 'quiz-js101',
    title: 'JavaScript Proficiency Evaluation',
    courseCode: 'JS101',
    courseName: 'Modern JavaScript Development',
    topic: 'ES6+ & Asynchronous Flow',
    competencyId: 'comp-js',
    competencyName: 'JavaScript',
    passingScore: 70,
    estimatedTime: '12 mins',
    questionsCount: 2,
    status: 'available',
    questions: [
      {
        id: 'q-js-1',
        question: 'What will Promise.all() do if one of the promises in the array rejects?',
        options: [
          'It waits for remaining promises to resolve before returning',
          'It immediately rejects with the reason of the first rejected promise',
          'It ignores the error and returns null for the failed index',
          'It retries the failed promise three times'
        ],
        correctAnswerIndex: 1,
        explanation: 'Promise.all is fail-fast: if any input promise rejects, the returned promise rejects immediately.'
      },
      {
        id: 'q-js-2',
        question: 'Which concept explains how inner functions retain access to variables from their outer enclosing scope?',
        options: [
          'Prototypal Inheritance',
          'Closure',
          'Event Delegation',
          'Hoisting'
        ],
        correctAnswerIndex: 1,
        explanation: 'A closure is a function bundled together with references to its lexical environment.'
      }
    ]
  },
  {
    id: 'quiz-git101',
    title: 'Git & Version Control Evaluation',
    courseCode: 'GIT101',
    courseName: 'Git & Version Control Mastery',
    topic: 'Branching & Rebase Workflows',
    competencyId: 'comp-git',
    competencyName: 'Git & Version Control',
    passingScore: 70,
    estimatedTime: '10 mins',
    questionsCount: 1,
    status: 'available',
    questions: [
      {
        id: 'q-git-1',
        question: 'What is the primary difference between git merge and git rebase?',
        options: [
          'git rebase deletes all commit history, while git merge keeps it',
          'git rebase rewrites project history by applying commits onto a new base tip, creating a linear history',
          'git merge only works on local branches, git rebase works on remote branches',
          'git rebase automatically resolves merge conflicts without user input'
        ],
        correctAnswerIndex: 1,
        explanation: 'Rebase moves the base of feature commits onto another branch tip for a clean linear history.'
      }
    ]
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
      message: `Demo environment initialized for '${DEMO_ORGANIZATION}' with 5 Trainees, 8 Competencies, and 6 Training Programs.`
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
      const nonDemoCerts = certs.filter(c => !c.id.startsWith('KUMA-2026-JS-002') && c.organization !== DEMO_ORGANIZATION);
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
