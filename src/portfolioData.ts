import React from 'react';

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  period: string;
  type: 'Professional' | 'Academic & Tutoring' | 'Strategic Marketing';
  highlights: string[];
  keywords: string;
  imageSlotKey: string;
  visualCode: string;
}

export interface LeadershipItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  category: 'University Leadership' | 'Global Award' | 'Humanitarian & Community';
  description: string;
  imageSlotKey: string;
  visualCode: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  authority: string;
  date: string;
  category: 'Supply Chain & Logistics' | 'Global Awards & Leadership' | 'Digital Strategy & Communication';
  verificationId?: string;
  verificationUrl?: string;
  skillsValidated: string;
  summary: string;
  badgeType: 'unilever' | 'thekap' | 'gee' | 'simplilearn' | 'nlp' | 'hypen' | 'adcamp' | 'yaymal-adv' | 'yaymal-basic';
  imageSlotKey: string;
}

export interface EvidencePhotoSlot {
  id: string;
  title: string;
  personName: string;
  personTitle: string;
  organization: string;
  location: string;
  context: string;
}

export const HERO_PROFILE_DATA = {
  name: 'Hein Htet Aung',
  degree: 'B.B.A. in Logistics & Supply Chain Management',
  university: 'Stamford International University · Bangkok, Thailand',
  slogan: 'Eager to Learn, Ready to Streamline Operations.',
  executiveSummary:
    'B.B.A. in Logistics & Supply Chain Management candidate in Bangkok combining Unilever-certified supply chain analytics, strategic procurement & inventory control, NGO relief logistics, and AI-driven workflow optimization to streamline end-to-end corporate operations.',
  location: 'Bangkok, Thailand',
  phone: '0994947850',
  phoneFormatted: '+66 (0) 99-494-7850',
  email: 'jonathanwyane3@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/hein-htet-aung-324b24358',
  linkedinHandle: 'linkedin.com/in/hein-htet-aung-324b24358',
  availability: 'Available for Corporate Supply Chain & Logistics Internship (Thailand)',
};

export const KPI_METRICS = [
  {
    value: '2024–Present',
    label: 'B.B.A. Logistics & Supply Chain',
    detail: 'Stamford International University',
  },
  {
    value: '3+ Years',
    label: 'Work & Tutoring Experience',
    detail: 'Business, Economics & Strategy',
  },
  {
    value: '5 Countries',
    label: 'Global Enterprise Award',
    detail: 'NZ Police Be Safe, Feel Safe Winner',
  },
  {
    value: '3 Languages',
    label: 'Multilingual Fluency',
    detail: 'English · Chinese · Burmese',
  },
];

export const EDUCATION_DATA = [
  {
    id: 'edu-1',
    degree: 'B.B.A. in Logistics and Supply Chain Management',
    institution: 'Stamford International University',
    location: 'Bangkok, Thailand',
    period: '2024 – Present',
    focusAreas: 'Procurement · Global Freight · Inventory Control · Supply Chain Analytics',
    leadershipRole: 'Table Tennis Club President (2025 – 2026) · 2026 Global Enterprise Experience Award Winner',
  },
];

export const SKILLS_MATRIX = {
  supplyChainCore: [
    { name: 'Supply Chain Management & Analytics', level: 'Unilever Certified' },
    { name: 'Procurement & Strategic Sourcing', level: 'Core Focus' },
    { name: 'Inventory & Warehouse Control', level: 'Operational' },
    { name: 'NGO & Relief Supply Chain', level: 'The Kap Certified' },
    { name: 'Demand Forecasting & Planning', level: 'Analytical' },
  ],
  hardAndDigitalSkills: [
    { name: 'Generative AI Workflow Automation', level: 'Advanced' },
    { name: 'Market Research & Data Synthesis', level: 'Advanced' },
    { name: 'Commercial Copywriting & Briefings', level: 'Certified Adv.' },
    { name: 'Digital Marketing & Meta Ads', level: '3+ Yrs Exp' },
    { name: 'Content Strategy & Lifecycle Ops', level: 'Coursera Certified' },
  ],
  softSkills: [
    'Cross-Cultural Leadership',
    'Presenting Skill',
    'Teamwork',
    'Adaptability',
    'Creativity',
  ],
  languages: [
    { language: 'English', proficiency: 'Upper-Intermediate' },
    { language: 'Chinese (Mandarin)', proficiency: 'Intermediate' },
    { language: 'Burmese', proficiency: 'Native' },
  ],
  interests: [
    'Procurement',
    'Supply Chain',
    'Community Services',
    'Create something with AI',
  ],
};

export const WORK_EXPERIENCE: ExperienceItem[] = [
  {
    id: 'exp-tutor',
    role: 'IGCSE O-Level Business Studies & Economics Tutor',
    organization: "John's Navigator · Academic Tutoring",
    location: 'Remote / Bangkok & Yangon',
    period: '2023 – Present',
    type: 'Academic & Tutoring',
    highlights: [
      'Mentor students in IGCSE Business Studies & Economics—covering supply chain operations, macroeconomics, and financial case analysis.',
      'Translate complex business frameworks into structured, actionable problem-solving strategies.',
    ],
    keywords: 'Operations Theory · Economics · Case Analysis · Mentorship',
    imageSlotKey: 'exp_photo_tutor',
    visualCode: "JOHN'S NAVIGATOR",
  },
  {
    id: 'exp-aim',
    role: 'Digital Marketing & Media Buying Specialist',
    organization: 'AIM Construction & Decoration Co., Ltd.',
    location: 'Remote',
    period: 'Dec 2023 – Present',
    type: 'Strategic Marketing',
    highlights: [
      'Execute paid social media & Facebook Media Buying strategies to drive high-intent commercial leads.',
      'Translate complex design specifications into clear client briefings and high-conversion copy.',
    ],
    keywords: 'ROI Optimization · Media Buying · Client Briefings',
    imageSlotKey: 'exp_photo_aim',
    visualCode: 'AIM CONSTRUCTION',
  },
  {
    id: 'exp-nca',
    role: 'Strategic Planning & Content Specialist',
    organization: 'Next Chapter Abroad',
    location: 'Remote',
    period: '2024 – 2025',
    type: 'Strategic Marketing',
    highlights: [
      'Developed strategic marketing roadmaps and leveraged Generative AI for rapid market research on global study destinations.',
      'Designed high-conversion campaigns that directly boosted student enrollment inquiries.',
    ],
    keywords: 'Strategic Planning · Generative AI · Market Research',
    imageSlotKey: 'exp_photo_nca',
    visualCode: 'NEXTCHAPTER ABROAD',
  },
  {
    id: 'exp-helix',
    role: 'Freelance Content Writer',
    organization: 'Helix International School',
    location: 'Yangon / Remote',
    period: '2024 – 2025',
    type: 'Professional',
    highlights: [
      'Developed comprehensive content calendars and localized copywriting using AI ideation workflows for diverse student demographics.',
    ],
    keywords: 'Content Calendars · AI Localization · Education Marketing',
    imageSlotKey: 'exp_photo_helix',
    visualCode: 'HELIX INTL SCHOOL',
  },
  {
    id: 'exp-cypress',
    role: 'Social Media Marketing Executive',
    organization: 'Cypress Education Academy',
    location: 'Yangon',
    period: '01/2024 – 03/2024',
    type: 'Professional',
    highlights: [
      'Managed end-to-end content lifecycles including writing, copywriting, and strict schedule adherence.',
    ],
    keywords: 'Lifecycle Management · Scheduling · Copywriting',
    imageSlotKey: 'exp_photo_cypress',
    visualCode: 'CYPRESS ACADEMY',
  },
];

export const EXTRACURRICULAR_AND_AWARDS: LeadershipItem[] = [
  {
    id: 'lead-1',
    role: 'Highly Commended New Zealand Police "Be Safe, Feel Safe" Award',
    organization: '2026 Global Enterprise Experience · Victoria University of Wellington',
    period: 'June 2026',
    category: 'Global Award',
    description:
      'Won with Team 20 collaborating across Fiji, Kenya, Netherlands, New Zealand, and Thailand.',
    imageSlotKey: 'lead_photo_gee',
    visualCode: 'GEE TEAM 20 AWARD',
  },
  {
    id: 'lead-2',
    role: 'Table Tennis Club President & Vice President',
    organization: 'Stamford International University · Thailand',
    period: '2025 – 2026',
    category: 'University Leadership',
    description:
      'Lead club operations, tournament logistics, equipment procurement, and member engagement at Stamford International University.',
    imageSlotKey: 'lead_photo_tt_president',
    visualCode: 'STAMFORD TABLE TENNIS',
  },
  {
    id: 'lead-3',
    role: 'Volunteer Content Writer (Certificate of Appreciation)',
    organization: 'Hypen Organization',
    period: '2024',
    category: 'Humanitarian & Community',
    description:
      'Recognized for outstanding dedication in community education outreach (Jan – Apr 2024).',
    imageSlotKey: 'lead_photo_hypen',
    visualCode: 'HYPEN VOLUNTEER',
  },
  {
    id: 'lead-4',
    role: 'Student Council President & Annual Fun Fair Host',
    organization: 'Helix International School',
    period: '2022 – 2023',
    category: 'University Leadership',
    description:
      'Elected Student Council President (2022) and Lead Host of the Annual Fun Fair Party (2023).',
    imageSlotKey: 'lead_photo_council',
    visualCode: 'STUDENT COUNCIL PRES.',
  },
  {
    id: 'lead-5',
    role: 'Myanmar Red Cross Society & COVID-19 Task Force',
    organization: 'Humanitarian Relief Operations',
    period: '2021 – 2022',
    category: 'Humanitarian & Community',
    description:
      'Frontline emergency supply distribution and community safety task force member.',
    imageSlotKey: 'lead_photo_redcross',
    visualCode: 'RED CROSS & TASK FORCE',
  },
  {
    id: 'lead-6',
    role: 'ENERVON C Filmmaking Award & Regional Table Tennis Sportsman',
    organization: 'Yangon Regional Competitions',
    period: 'Awarded',
    category: 'Global Award',
    description:
      'ENERVON C Filmmaking Appreciation Award & Outstanding Sportsman in Yangon Table Tennis Tournament.',
    imageSlotKey: 'lead_photo_enervon',
    visualCode: 'FILMMAKING & SPORTSMAN',
  },
];

export const CERTIFICATES_DATA: CertificateItem[] = [
  {
    id: 'cert-unilever',
    title: 'Supply Chain Management and Analytics',
    issuer: 'Unilever · Coursera',
    authority: 'Unilever Corporate Supply Chain',
    date: 'Sep 18, 2026',
    category: 'Supply Chain & Logistics',
    verificationId: 'XPNC5K3X30FC',
    verificationUrl: 'https://coursera.org/verify/XPNC5K3X30FC',
    skillsValidated: 'Supply Chain Analytics · Demand Planning · Inventory Control',
    summary: 'Authorized by Unilever via Coursera. Validates corporate supply chain analytics and logistics operations.',
    badgeType: 'unilever',
    imageSlotKey: 'cert_unilever',
  },
  {
    id: 'cert-thekap',
    title: 'Logistics and Supply Chain Management Training for NGO Professionals',
    issuer: 'The Kap — Training, Research & Consultancy',
    authority: 'Aug 23 – Sep 21, 2025',
    date: 'Sep 27, 2025',
    category: 'Supply Chain & Logistics',
    verificationId: 'QR-VERIFIED-2025',
    skillsValidated: 'Procurement · Warehousing · Relief Distribution',
    summary: 'Intensive professional training in procurement procedures, warehousing, and relief supply chains.',
    badgeType: 'thekap',
    imageSlotKey: 'cert_thekap',
  },
  {
    id: 'cert-gee',
    title: 'Highly Commended New Zealand Police Be Safe, Feel Safe Award',
    issuer: 'Global Enterprise Experience (NZ)',
    authority: 'Victoria University of Wellington',
    date: 'Jun 18, 2026',
    category: 'Global Awards & Leadership',
    verificationId: 'GEE-2026-TEAM-20',
    skillsValidated: 'Cross-Border Leadership · Global Operations',
    summary: 'Awarded to Team 20 (Fiji, Kenya, Netherlands, New Zealand, Thailand) for enterprise leadership.',
    badgeType: 'gee',
    imageSlotKey: 'cert_gee',
  },
  {
    id: 'cert-simplilearn',
    title: 'Content Strategy (Course Certificate)',
    issuer: 'Simplilearn · Coursera',
    authority: 'Aparajita Singh, Instructor',
    date: 'Apr 21, 2025',
    category: 'Digital Strategy & Communication',
    verificationId: 'W0LH0G2CZIOE',
    verificationUrl: 'https://coursera.org/verify/W0LH0G2CZIOE',
    skillsValidated: 'Strategic Communication · Content Operations',
    summary: 'Authorized by Simplilearn via Coursera in strategic planning and audience research.',
    badgeType: 'simplilearn',
    imageSlotKey: 'cert_simplilearn',
  },
  {
    id: 'cert-nlp',
    title: 'I-Am-Gifted Program for Dynamic Personal Breakthrough',
    issuer: 'Kyaw Thu & Associates · NLP Centre',
    authority: '30-Hour Experiential Training',
    date: 'Apr 1, 2016',
    category: 'Global Awards & Leadership',
    skillsValidated: '4Cs Leadership · Mind Mapping · Critical Thinking',
    summary: 'Completed 30-hour training in Academic Excellence, Mind Mapping, and 21st Century 4Cs.',
    badgeType: 'nlp',
    imageSlotKey: 'cert_nlp',
  },
  {
    id: 'cert-hypen',
    title: 'Certificate of Appreciation — Content Writer',
    issuer: 'Hypen Organization',
    authority: 'Min Khant Thway, Head',
    date: 'Jan – Apr 2024',
    category: 'Global Awards & Leadership',
    skillsValidated: 'Organizational Communication · Volunteering',
    summary: 'Recognized as an outstanding and dedicated volunteer Content Writer.',
    badgeType: 'hypen',
    imageSlotKey: 'cert_hypen',
  },
  {
    id: 'cert-adcamp',
    title: 'Facebook AdCamp Training — Batch (2)',
    issuer: 'Create Influence Academy',
    authority: 'Aung Mon Chan, Founder',
    date: '2024',
    category: 'Digital Strategy & Communication',
    skillsValidated: 'Media Buying · Campaign Analytics',
    summary: 'Completed practical media buying and campaign optimization assignments.',
    badgeType: 'adcamp',
    imageSlotKey: 'cert_adcamp',
  },
  {
    id: 'cert-yaymal-adv',
    title: 'Professional Copywriting Course (Advanced) — Batch 4',
    issuer: 'Yay Mal Academy',
    authority: 'Saung Hnin Phyu, Founder',
    date: 'Mar 31, 2024',
    category: 'Digital Strategy & Communication',
    skillsValidated: 'Commercial Briefings · Persuasive Copy',
    summary: 'Advanced certification in commercial copywriting and research synthesis.',
    badgeType: 'yaymal-adv',
    imageSlotKey: 'cert_yaymal_adv',
  },
  {
    id: 'cert-yaymal-basic',
    title: 'Basic Content & Copywriting Course — Batch 27',
    issuer: 'Yay Mal Academy',
    authority: 'Saung Hnin Phyu, Founder',
    date: 'Jan 12, 2024',
    category: 'Digital Strategy & Communication',
    skillsValidated: 'Content Foundations · Editorial Structure',
    summary: 'Foundational certification in structured business content creation.',
    badgeType: 'yaymal-basic',
    imageSlotKey: 'cert_yaymal_basic',
  },
];

export const CORPORATE_EVIDENCE_SLOTS: EvidencePhotoSlot[] = [
  {
    id: 'evidence-shell',
    title: 'Mr. Thanet Puwapiromkwan',
    personName: 'Mr. Thanet Puwapiromkwan',
    personTitle: 'Director of Shell Company Limited',
    organization: 'Stamford International University · Thailand',
    location: 'Bangkok, Thailand',
    context:
      'Industry leadership engagement with the Director of Shell Company Limited on multinational energy & supply chain operations.',
  },
  {
    id: 'evidence-ib-head',
    title: 'Asst. Prof. Dr. Phanrajit Havarangsi',
    personName: 'Asst. Prof. Dr. Phanrajit Havarangsi',
    personTitle: 'Head of International Business Department',
    organization: 'Stamford International University · Thailand',
    location: 'Bangkok, Thailand',
    context:
      'Academic mentorship and direct endorsement from the Head of International Business Department at Stamford International University.',
  },
];

export const ACADEMIC_REFERENCES = [
  {
    id: 'ref-1',
    name: 'Asst. Prof. Dr. Phanrajit Havarangsi',
    role: 'Head of International Business Department · Director of IBM Program',
    organization: 'Stamford International University, Thailand',
    phone: '+ (66) 2769-4000 #2195',
    email: 'phanrajit.havarangsi@stamford.edu',
  },
  {
    id: 'ref-2',
    name: 'Mr. Edward Tang',
    role: 'Head of Logistics and Supply Chain Management',
    organization: 'Stamford International University, Thailand',
    phone: '',
    email: 'edward.tang@stamford.edu',
  },
];
