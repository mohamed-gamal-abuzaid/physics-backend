import { desc, eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { appSettings } from '../../db/models/app-settings.js';
import { hallOfFame } from '../../db/models/hall-of-fame.js';
import { reviews } from '../../db/models/reviews.js';
import { studentProfiles, users } from '../../db/models/users.js';
import { hashPassword } from '../../utils/auth.js';
import { BookSessionInquiryInput, TrialRegistrationInput } from './public.schema.js';

const DEFAULT_LANDING_PLANS = [
  {
    id: 'plan-private-1',
    title: 'Private 1-to-1 Intensive',
    price: 600,
    format: '1-to-1',
    sessionsCount: 4,
    currency: 'EGP',
    groupNumber: 'N/A',
    maxStudents: 1,
    description: 'Fully personalised sessions tailored to your exact curriculum, exam board, and pace.',
    features: ['100% customised pacing', 'Direct 1-on-1 feedback every session', 'High-definition session recordings'],
    highlight: false,
    badge: 'Individual Mentorship',
  },
  {
    id: 'plan-group-standard',
    title: 'Group Masterclass (Cohort Alpha)',
    price: 300,
    format: 'group',
    sessionsCount: 4,
    currency: 'EGP',
    groupNumber: 'Group 1',
    maxStudents: 12,
    description: 'Collaborative learning in rigorous cohorts — unbeatable value with problem sets.',
    features: ['Peer discussion & shared problem sets', 'Formula sheets & lecture notes', 'Weekly live Q&A roundups'],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'plan-group-small',
    title: 'Small Group Cohort (<7)',
    price: 400,
    format: 'group',
    sessionsCount: 4,
    currency: 'EGP',
    groupNumber: 'Group 2',
    maxStudents: 6,
    description: 'Intimate group sessions combining deep personalization with energetic team dynamics.',
    features: ['High interactive engagement per student', 'Flexible scheduling windows', 'Shared notes & assignment hub'],
    highlight: false,
    badge: 'Limited Seats',
  },
];

export class PublicService {
  async getConfig() {
    try {
      const [settings] = await db.select().from(appSettings).limit(1);
      if (settings) {
        const storedPricing: any = settings.sessionPricing || {};
        const sessionPricing = {
          oneToOneRate: storedPricing.oneToOneRate ?? 600,
          groupRate7Plus: storedPricing.groupRate7Plus ?? 300,
          groupRateUnder7: storedPricing.groupRateUnder7 ?? 400,
          currency: storedPricing.currency ?? 'EGP',
          plans: Array.isArray(storedPricing.plans) && storedPricing.plans.length > 0
            ? storedPricing.plans
            : DEFAULT_LANDING_PLANS,
        };

        return {
          introVideoUrl: settings.introVideoUrl,
          stagesOptions: settings.stagesOptions ?? [
            { id: 'y10', name: 'Year 10 (IGCSE Foundations)', code: 'Y10', description: 'Core and introductory physics principles' },
            { id: 'y11', name: 'Year 11 (IGCSE / O-Level)', code: 'Y11', description: 'Complete IGCSE syllabus and past paper training' },
            { id: 'y12', name: 'Year 12 (AS-Level)', code: 'Y12', description: 'Advanced Subsidiary physics concepts' },
            { id: 'y13', name: 'Year 13 (A2-Level)', code: 'Y13', description: 'Advanced Level & university entrance mastery' },
          ],
          curriculaOptions: settings.curriculaOptions ?? [
            { id: 'cambridge-0625', name: 'Cambridge IGCSE Physics (0625)', board: 'Cambridge', stage: 'Year 10 / Year 11', code: '0625' },
            { id: 'cambridge-9702-as', name: 'Cambridge AS-Level Physics (9702)', board: 'Cambridge', stage: 'Year 12', code: '9702 AS' },
            { id: 'cambridge-9702-a2', name: 'Cambridge A2-Level Physics (9702)', board: 'Cambridge', stage: 'Year 13', code: '9702 A2' },
            { id: 'edexcel-4ph1', name: 'Edexcel International IGCSE Physics (4PH1)', board: 'Edexcel', stage: 'Year 10 / Year 11', code: '4PH1' },
            { id: 'edexcel-wph11-12', name: 'Edexcel International A-Level Physics (WPH11/12)', board: 'Edexcel', stage: 'Year 12 / Year 13', code: 'IAL Physics' },
            { id: 'oxford-9630', name: 'Oxford AQA International A-Level Physics (9630)', board: 'Oxford AQA', stage: 'Year 12 / Year 13', code: '9630' },
          ],
          examSessionOptions: settings.examSessionOptions ?? [
            'May/June 2025',
            'Oct/Nov 2025',
            'May/June 2026',
          ],
          sessionPricing,
        };
      }
    } catch {
      // Fallback to defaults when settings are unseeded or database is unreachable
    }

    return {
      introVideoUrl: null,
      stagesOptions: [
        { id: 'y10', name: 'Year 10 (IGCSE Foundations)', code: 'Y10', description: 'Core and introductory physics principles' },
        { id: 'y11', name: 'Year 11 (IGCSE / O-Level)', code: 'Y11', description: 'Complete IGCSE syllabus and past paper training' },
        { id: 'y12', name: 'Year 12 (AS-Level)', code: 'Y12', description: 'Advanced Subsidiary physics concepts' },
        { id: 'y13', name: 'Year 13 (A2-Level)', code: 'Y13', description: 'Advanced Level & university entrance mastery' },
      ],
      curriculaOptions: [
        { id: 'cambridge-0625', name: 'Cambridge IGCSE Physics (0625)', board: 'Cambridge', stage: 'Year 10 / Year 11', code: '0625' },
        { id: 'cambridge-9702-as', name: 'Cambridge AS-Level Physics (9702)', board: 'Cambridge', stage: 'Year 12', code: '9702 AS' },
        { id: 'cambridge-9702-a2', name: 'Cambridge A2-Level Physics (9702)', board: 'Cambridge', stage: 'Year 13', code: '9702 A2' },
        { id: 'edexcel-4ph1', name: 'Edexcel International IGCSE Physics (4PH1)', board: 'Edexcel', stage: 'Year 10 / Year 11', code: '4PH1' },
        { id: 'edexcel-wph11-12', name: 'Edexcel International A-Level Physics (WPH11/12)', board: 'Edexcel', stage: 'Year 12 / Year 13', code: 'IAL Physics' },
        { id: 'oxford-9630', name: 'Oxford AQA International A-Level Physics (9630)', board: 'Oxford AQA', stage: 'Year 12 / Year 13', code: '9630' },
      ],
      examSessionOptions: ['May/June 2025', 'Oct/Nov 2025', 'May/June 2026'],
      sessionPricing: {
        oneToOneRate: 600,
        groupRate7Plus: 300,
        groupRateUnder7: 400,
        currency: 'EGP',
        plans: DEFAULT_LANDING_PLANS,
      },
    };
  }

  async getHallOfFame() {
    return db
      .select({
        id: hallOfFame.id,
        studentName: hallOfFame.studentName,
        avatar: hallOfFame.avatar,
        cohort: hallOfFame.cohort,
        superlativeBadge: hallOfFame.superlativeBadge,
        quote: hallOfFame.quote,
        admittedUniversity: hallOfFame.admittedUniversity,
        gradeOrScore: hallOfFame.gradeOrScore,
        curriculum: hallOfFame.curriculum,
        majorField: hallOfFame.majorField,
        mentorLetter: hallOfFame.mentorLetter,
        mentorName: hallOfFame.mentorName,
        graduationDate: hallOfFame.graduationDate,
        honors: hallOfFame.honors,
        certificateId: hallOfFame.certificateId,
      })
      .from(hallOfFame)
      .orderBy(desc(hallOfFame.graduationDate));
  }

  async getCertificate(certificateId: string) {
    const [alumni] = await db
      .select({
        id: hallOfFame.id,
        studentName: hallOfFame.studentName,
        avatar: hallOfFame.avatar,
        cohort: hallOfFame.cohort,
        superlativeBadge: hallOfFame.superlativeBadge,
        quote: hallOfFame.quote,
        admittedUniversity: hallOfFame.admittedUniversity,
        gradeOrScore: hallOfFame.gradeOrScore,
        curriculum: hallOfFame.curriculum,
        majorField: hallOfFame.majorField,
        mentorLetter: hallOfFame.mentorLetter,
        mentorName: hallOfFame.mentorName,
        graduationDate: hallOfFame.graduationDate,
        honors: hallOfFame.honors,
        certificateId: hallOfFame.certificateId,
      })
      .from(hallOfFame)
      .where(eq(hallOfFame.certificateId, certificateId))
      .limit(1);

    if (!alumni) throw new Error('CERTIFICATE_NOT_FOUND');
    return alumni;
  }

  async getReviews() {
    return db
      .select({
        id: reviews.id,
        name: reviews.name,
        cohort: reviews.cohort,
        content: reviews.content,
        rating: reviews.rating,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.status, 'APPROVED'))
      .orderBy(desc(reviews.createdAt));
  }

  async getPaymentChannels() {
    return [
      {
        channel: 'InstaPay',
        identifier: 'physics-academy@instapay',
        accountName: 'Physics Academy Office',
        instructions: 'Transfer the package amount via InstaPay and upload the transfer receipt screenshot.',
      },
      {
        channel: 'Vodafone Cash',
        identifier: '01000000000',
        accountName: 'Academy Direct Accounts',
        instructions: 'Send via Vodafone Cash wallet and submit the receipt with sender phone number.',
      },
      {
        channel: 'Bank Wire / CIB',
        bankName: 'Commercial International Bank (CIB)',
        accountNumber: '100055443322',
        iban: 'EG2200100055443322000000000',
        swift: 'CIBEGCAXXX',
        accountName: 'Mr. Mohammed Sayed Physics Academy',
        instructions: 'Transfer to official academy bank account and keep reference number.',
      },
    ];
  }

  async registerTrial(data: TrialRegistrationInput) {
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const tempPassword = await hashPassword(randomBytes(16).toString('hex'));

    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: tempPassword,
          role: 'STUDENT',
          status: 'Waiting for Activation',
        })
        .returning();

      await tx.insert(studentProfiles).values({
        userId: user.id,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        gradeLevel: data.gradeLevel,
        cohort: data.cohort,
        schoolName: data.schoolName,
        academicYear: data.academicYear,
        examBoard: data.examBoard,
        examSession: data.examSession,
        hardestTopic: data.hardestTopic,
        enrolledCourse: data.enrolledCourse,
        notes: data.notes,
        registeredVia: 'Free Trial',
        isAccountGranted: false,
      });

      return {
        success: true,
        message: 'Your free trial registration has been received! Our academic coordinator will contact you shortly.',
        studentId: user.id,
      };
    });
  }

  async bookSessionInquiry(data: BookSessionInquiryInput) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

    if (existingUser) {
      return {
        success: true,
        message: 'Session booking inquiry received! We will follow up to confirm your schedule.',
        studentId: existingUser.id,
      };
    }

    const tempPassword = await hashPassword(randomBytes(16).toString('hex'));

    return db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: tempPassword,
          role: 'STUDENT',
          status: 'Waiting for Activation',
        })
        .returning();

      await tx.insert(studentProfiles).values({
        userId: newUser.id,
        gradeLevel: data.gradeLevel,
        enrolledCourse: data.courseName,
        notes: data.notes ? `Booking inquiry notes: ${data.notes}` : undefined,
        registeredVia: 'Book a Session',
        isAccountGranted: false,
      });

      return {
        success: true,
        message: 'Session booking inquiry received! We will follow up to confirm your schedule.',
        studentId: newUser.id,
      };
    });
  }
}

export const publicService = new PublicService();
