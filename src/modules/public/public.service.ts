import { desc, eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { appSettings } from '../../db/models/app-settings.js';
import { hallOfFame } from '../../db/models/hall-of-fame.js';
import { reviews } from '../../db/models/reviews.js';
import { studentProfiles, users } from '../../db/models/users.js';
import { hashPassword } from '../../utils/auth.js';
import { BookSessionInquiryInput, TrialRegistrationInput } from './public.schema.js';

export class PublicService {
  async getConfig() {
    try {
      const [settings] = await db.select().from(appSettings).limit(1);
      if (settings) {
        return {
          introVideoUrl: settings.introVideoUrl,
          curriculaOptions: settings.curriculaOptions ?? [
            'Cambridge IGCSE',
            'Edexcel International A-Level',
            'Oxford AQA',
            'AP Physics C',
          ],
          examSessionOptions: settings.examSessionOptions ?? [
            'May/June 2025',
            'Oct/Nov 2025',
            'May/June 2026',
          ],
          sessionPricing: settings.sessionPricing ?? {
            oneToOneRate: 450,
            groupRate7Plus: 200,
            groupRateUnder7: 280,
            currency: 'EGP',
          },
        };
      }
    } catch {
      // Fallback to defaults when settings are unseeded or database is unreachable
    }

    return {
      introVideoUrl: null,
      curriculaOptions: [
        'Cambridge IGCSE',
        'Edexcel International A-Level',
        'Oxford AQA',
        'AP Physics C',
      ],
      examSessionOptions: ['May/June 2025', 'Oct/Nov 2025', 'May/June 2026'],
      sessionPricing: {
        oneToOneRate: 450,
        groupRate7Plus: 200,
        groupRateUnder7: 280,
        currency: 'EGP',
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
