/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Source, Lecture, Quiz, NotificationItem, UserSettings, FAQItem, PricingPlan, CatalogCompetency } from './types';

export const INITIAL_SOURCES: Source[] = [];

export const INITIAL_LECTURES: Lecture[] = [];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-comp-1',
    title: 'Data Analysis Fundamentals',
    topic: 'Data Cleaning, Aggregation & Charting',
    courseCode: 'DA-101',
    courseName: 'Data Analytics & Insights Program',
    description: 'Evaluates proficiency in core statistical operations, data hygiene, and exploratory data analysis.',
    questionsCount: 5,
    estimatedTime: '15 mins',
    passingScore: 60,
    competencyId: 'cat-comp-2',
    competencyName: 'Data Analysis & Insights',
    competencyIds: ['cat-comp-2'],
    competencyNames: ['Data Analysis & Insights'],
    status: 'available',
    createdAt: '2026-09-20',
    questions: [
      {
        id: 'q1-1',
        type: 'mcq',
        question: 'Which method is used to remove missing values from a pandas DataFrame?',
        options: ['df.dropna()', 'df.remove_nulls()', 'df.clean()', 'df.delete_empty()'],
        correctAnswerIndex: 0,
        explanation: 'dropna() removes missing values along a specified axis in pandas.'
      },
      {
        id: 'q1-2',
        type: 'mcq',
        question: 'What type of plot is best suited to display the distribution of a single numerical variable?',
        options: ['Pie chart', 'Histogram', 'Line chart', 'Scatter plot'],
        correctAnswerIndex: 1,
        explanation: 'Histograms represent frequency distributions of continuous quantitative data.'
      },
      {
        id: 'q1-3',
        type: 'mcq',
        question: 'In statistics, what does the median represent?',
        options: ['The arithmetic average', 'The middle value in an ordered dataset', 'The most frequent value', 'The standard deviation'],
        correctAnswerIndex: 1,
        explanation: 'The median divides an ordered dataset into two equal halves.'
      },
      {
        id: 'q1-4',
        type: 'mcq',
        question: 'What is the correlation coefficient range for linear relationships?',
        options: ['0 to 1', '-1 to +1', '-10 to +10', '0 to 100'],
        correctAnswerIndex: 1,
        explanation: 'Pearson correlation coefficients range from -1 (perfect negative) to +1 (perfect positive).'
      },
      {
        id: 'q1-5',
        type: 'mcq',
        question: 'Which SQL clause is used to filter records after aggregation?',
        options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'],
        correctAnswerIndex: 2,
        explanation: 'HAVING filters aggregate function results, whereas WHERE filters row-level data.'
      }
    ]
  },
  {
    id: 'quiz-comp-2',
    title: 'Python Scripting & Automation Assessment',
    topic: 'Python Control Flow & Functions',
    courseCode: 'PY-201',
    courseName: 'Python Technical Workshop',
    description: 'Measures hands-on ability to build scripts, handle exceptions, and structure reusable Python code.',
    questionsCount: 4,
    estimatedTime: '12 mins',
    passingScore: 70,
    competencyId: 'cat-comp-1',
    competencyName: 'Python Programming',
    competencyIds: ['cat-comp-1'],
    competencyNames: ['Python Programming'],
    status: 'available',
    createdAt: '2026-09-22',
    questions: [
      {
        id: 'q2-1',
        type: 'mcq',
        question: 'Which built-in Python data structure is mutable and ordered?',
        options: ['Tuple', 'List', 'Set', 'Frozenset'],
        correctAnswerIndex: 1,
        explanation: 'Lists are mutable ordered sequences of elements.'
      },
      {
        id: 'q2-2',
        type: 'mcq',
        question: 'What keyword is used to handle runtime exceptions in Python?',
        options: ['catch', 'except', 'error', 'handle'],
        correctAnswerIndex: 1,
        explanation: 'try...except blocks capture runtime exceptions in Python.'
      },
      {
        id: 'q2-3',
        type: 'mcq',
        question: 'What is the output of len({1, 2, 2, 3}) in Python?',
        options: ['4', '3', '2', 'Error'],
        correctAnswerIndex: 1,
        explanation: 'Sets enforce uniqueness, so duplicate 2 is removed, resulting in 3 elements.'
      },
      {
        id: 'q2-4',
        type: 'mcq',
        question: 'Which operator is used for integer division in Python 3?',
        options: ['/', '//', '%', '^'],
        correctAnswerIndex: 1,
        explanation: '// performs floor division in Python.'
      }
    ]
  },
  {
    id: 'quiz-comp-3',
    title: 'Digital Tools & Cloud Workflow Literacy',
    topic: 'Digital Workspace & Tools',
    courseCode: 'DT-100',
    courseName: 'Digital Transformation Program',
    description: 'Assesses digital adoption capability, cloud security practices, and online collaboration tools.',
    questionsCount: 4,
    estimatedTime: '10 mins',
    passingScore: 60,
    competencyId: 'cat-comp-9',
    competencyName: 'Digital Literacy & Tech Adoption',
    competencyIds: ['cat-comp-9'],
    competencyNames: ['Digital Literacy & Tech Adoption'],
    status: 'available',
    createdAt: '2026-09-25',
    questions: [
      {
        id: 'q3-1',
        type: 'mcq',
        question: 'What is the primary benefit of Multi-Factor Authentication (MFA)?',
        options: ['Faster login speeds', 'Adds an additional layer of security beyond passwords', 'Replaces passwords entirely', 'Encrypts local hard drives'],
        correctAnswerIndex: 1,
        explanation: 'MFA requires two or more verification factors to gain access to resources.'
      },
      {
        id: 'q3-2',
        type: 'mcq',
        question: 'Which cloud service model provides virtualized computing infrastructure over the internet?',
        options: ['SaaS', 'PaaS', 'IaaS', 'FaaS'],
        correctAnswerIndex: 2,
        explanation: 'IaaS (Infrastructure as a Service) delivers fundamental compute, network, and storage resources.'
      },
      {
        id: 'q3-3',
        type: 'mcq',
        question: 'What is the main goal of digital transformation in public organizations?',
        options: ['Increasing paper usage', 'Modernizing service delivery and improving operational efficiency', 'Replacing human personnel with static spreadsheets', 'Decreasing accessibility'],
        correctAnswerIndex: 1,
        explanation: 'Digital transformation leverages modern technologies to optimize workflows and public service delivery.'
      },
      {
        id: 'q3-4',
        type: 'mcq',
        question: 'What does SaaS stand for?',
        options: ['Software as a Service', 'Storage as a System', 'Security as a Service', 'Server as an Architecture'],
        correctAnswerIndex: 0,
        explanation: 'SaaS stands for Software as a Service.'
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_COMPETENCY_CATALOG: CatalogCompetency[] = [
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

export const INITIAL_SETTINGS: UserSettings = {
  profile: {
    fullName: 'Trainee Learner',
    emailAddress: 'trainee@organization.gov.in',
    bio: 'Dedicated professional focusing on capacity building, learning, and skill development.',
    avatarUrl: '',
    institution: 'National Capacity Building Portal',
    role: 'Senior Associate',
    organization: 'Ministry of Skill Development & Entrepreneurship',
    department: 'Capacity Building & Training',
    designation: 'Senior Training Associate',
    yearsOfExperience: 4,
    skills: [
      { id: 'sk-1', name: 'Data Analysis', level: 'Intermediate' },
      { id: 'sk-2', name: 'Communication & Outreach', level: 'Advanced' },
      { id: 'sk-3', name: 'Project Management', level: 'Beginner' }
    ],
    competencies: [
      { id: 'comp-1', competencyId: 'cat-comp-6', name: 'Organizational Leadership', category: 'Leadership', level: 'Intermediate', numericLevel: 2, description: 'Guiding teams, setting strategic goals, and driving organizational transformation.' },
      { id: 'comp-2', competencyId: 'cat-comp-8', name: 'Public Policy Implementation', category: 'Domain Specific', level: 'Advanced', numericLevel: 3, description: 'Designing and executing public sector policies and governance frameworks.' },
      { id: 'comp-3', competencyId: 'cat-comp-9', name: 'Digital Literacy & Tech Adoption', category: 'Digital', level: 'Expert', numericLevel: 4, description: 'Adopting digital platforms, cloud workflows, and AI toolchains across units.' }
    ],
    certifications: [
      { id: 'cert-1', name: 'Certified Professional in Learning & Performance', issuingOrganization: 'ATD', issueDate: '2024-03-15', credentialId: 'ATD-88492' }
    ]
  },
  subscription: {
    planName: 'BYOK',
    price: '₹0',
    billingCycle: 'monthly',
    nextBillDate: 'Dec 15, 2026',
    features: [
      'Bring Your Own Key (BYOK)',
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Academic Library & Quiz Workspace'
    ]
  },
  integrations: {
    canvasConnected: false,
    blackboardConnected: false,
    canvasUrl: '',
    lastSynced: 'Never'
  },
  aiLevels: {
    proactiveConceptSuggestion: true,
    automatedBibliography: true,
    highIntensitySynthesis: false
  }
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq1',
    question: 'How secure is my learning data and capacity building records?',
    answer: 'We run isolated storage sandboxes. Your training documents, transcripts, and session outputs are encrypted in transit and at rest using AES-256. We strictly enforce a proprietary policy: your uploaded resources and personal annotations are NEVER passed into public models for training.'
  },
  {
    id: 'faq2',
    question: 'Can I export my synthesized training materials to standard formats like LaTeX or Markdown?',
    answer: 'Absolutely. Every competency note, executive summary, training outline, or assessment module you generate inside Kuma AI is exportable. You can click "Export" on the workspace headers and select LaTeX (.tex) or clean GitHub-flavored Markdown (.md).'
  },
  {
    id: 'faq3',
    question: 'Does Kuma AI cite and match statements back to my exact source material?',
    answer: 'Yes! That is one of our fundamental design objectives. When you read an AI Summary or work through the Knowledge Studio, any claims or synthesized bullet points generate clickable citation numbers. Clicking a number scrolls your resource preview directly to the matching paragraph block or specific timestamp inside raw transcribing logs.'
  },
  {
    id: 'faq4',
    question: 'How does the "Skill Gap Analysis" radar work?',
    answer: 'Kuma AI aggregates telemetry from your competency assessments, training completions, and evaluation sessions. It uses custom semantic mapping to trace skills back to organizational competencies, analyzes proficiency levels, and identifies skill gaps, helping you recommend optimal training paths.'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'BYOK',
    tierLabel: 'TIER 01',
    price: '₹0',
    period: 'forever',
    tagline: 'Bring your own API key for unlimited analysis.',
    description: 'Use your own Gemini or OpenAI API keys directly.',
    ctaText: 'Get Started',
    features: [
      'Bring Your Own Key (BYOK)',
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Academic Library & Quiz Workspace'
    ],
    isPopular: false,
    highlighted: false
  },
  {
    name: 'Premium',
    tierLabel: 'TIER 02',
    price: '₹399',
    period: 'month',
    tagline: 'No API key needed. Managed high-speed academic AI model access.',
    description: 'We provide high-speed, managed Gemini API keys.',
    ctaText: 'Upgrade to Scholar Pro',
    features: [
      'Direct API access (We provide keys)',
      'Unlimited managed AI runs',
      '100 GB High-Speed Storage',
      'Instant OCR & Math Formula Parsing',
      'Weak Topic Tracker Radar',
      'Priority Email & Chat Support'
    ],
    isPopular: true,
    highlighted: true
  },
  {
    name: 'Institution',
    tierLabel: 'TIER 03',
    price: 'Locked',
    period: 'under work',
    tagline: 'Team collaboration & campus LMS sync under active development.',
    description: 'Institution campus features are currently under development.',
    ctaText: '🔒 Under Development',
    features: [
      'Canvas & Blackboard LMS Integration (In Progress)',
      'Department-wide Shared Workspaces',
      'SSO & SAML Security Auditing',
      'Custom LLM Fine-Tuning'
    ],
    isPopular: false,
    highlighted: false
  }
];
