import { and, count, desc, eq, gt, or, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { assignments } from '../../db/models/assignments.js';
import { bookingSessions } from '../../db/models/booking-sessions.js';
import { homeworkSubmissions } from '../../db/models/homework-submissions.js';
import { notifications } from '../../db/models/notifications.js';
import { paymentProofs } from '../../db/models/payment-proofs.js';
import { resources } from '../../db/models/resources.js';
import { reviews } from '../../db/models/reviews.js';
import { studentProfiles, users } from '../../db/models/users.js';
import {
  CreatePaymentInput,
  CreateReviewInput,
  CreateSessionInput,
  CreateSubmissionInput,
  ListInput,
  RescheduleSessionInput,
  UpdateProfileInput,
} from './student.schema.js';
import { getPagination, paginated } from '../../utils/pagination.js';

export const canAccessAssignment = (
  assignment: { studentId: number | null; assignedStudentIds: unknown },
  userId: number,
) => {
  const assignedStudentIds = Array.isArray(assignment.assignedStudentIds)
    ? assignment.assignedStudentIds
    : [];
  return assignment.studentId === userId || assignedStudentIds.includes(userId);
};

export class StudentService {
  async getDashboard(userId: number, input: ListInput) {
    const [profile, assignmentList, sessionList, notificationList, submissionList] = await Promise.all([
      this.getProfile(userId),
      this.getAssignments(userId, input),
      this.getSessions(userId, input),
      this.getNotifications(userId, input),
      this.getSubmissions(userId, input),
    ]);

    return {
      profile,
      assignments: assignmentList,
      sessions: sessionList,
      notifications: notificationList,
      submissions: submissionList,
    };
  }

  async getProfile(userId: number) {
    const [profile] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatar: users.avatar,
      specialty: users.specialty,
      status: users.status,
      role: users.role,
      studentProfile: studentProfiles,
    }).from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!profile) throw new Error('STUDENT_NOT_FOUND');
    return profile;
  }

  async updateProfile(userId: number, data: UpdateProfileInput) {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId)).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        specialty: users.specialty,
        status: users.status,
        role: users.role,
      });
    if (!updated) throw new Error('STUDENT_NOT_FOUND');
    return updated;
  }

  async getAssignments(userId: number, input: ListInput) {
    const condition = or(
      eq(assignments.studentId, userId),
      sql`${assignments.assignedStudentIds} @> ${JSON.stringify([userId])}::jsonb`,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(assignments).where(condition).orderBy(desc(assignments.createdAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(assignments).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getAssignment(userId: number, assignmentId: number) {
    const [assignment] = await db.select().from(assignments).where(and(
      eq(assignments.id, assignmentId),
      or(
        eq(assignments.studentId, userId),
        sql`${assignments.assignedStudentIds} @> ${JSON.stringify([userId])}::jsonb`,
      ),
    )).limit(1);
    if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND');
    return assignment;
  }

  async getSubmissions(userId: number, input: ListInput) {
    const condition = eq(homeworkSubmissions.studentId, userId);
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(homeworkSubmissions).where(condition).orderBy(desc(homeworkSubmissions.submittedAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(homeworkSubmissions).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async createSubmission(userId: number, assignmentId: number, data: CreateSubmissionInput) {
    const assignment = await this.getAssignment(userId, assignmentId);
    if (assignment.dueDate && assignment.dueDate <= new Date()) {
      throw new Error('ASSIGNMENT_DEADLINE_PASSED');
    }
    const [existing] = await db.select({ id: homeworkSubmissions.id }).from(homeworkSubmissions)
      .where(and(eq(homeworkSubmissions.assignmentId, assignmentId), eq(homeworkSubmissions.studentId, userId)))
      .limit(1);
    if (existing) throw new Error('SUBMISSION_EXISTS');

    const [submission] = await db.insert(homeworkSubmissions).values({
      assignmentId,
      studentId: userId,
      ...data,
      status: 'SUBMITTED',
    }).returning();
    return submission;
  }

  async getSessions(userId: number, input: ListInput) {
    const condition = and(
      eq(bookingSessions.studentId, userId),
      eq(bookingSessions.isArchived, false),
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(bookingSessions).where(condition).orderBy(desc(bookingSessions.date)).limit(limit).offset(offset),
      db.select({ total: count() }).from(bookingSessions).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async createSession(userId: number, data: CreateSessionInput) {
    if (data.date <= new Date()) throw new Error('SESSION_DATE_INVALID');

    const [teacher] = await db.select({ id: users.id }).from(users).where(and(
      eq(users.id, data.teacherId),
      eq(users.role, 'ADMIN'),
      eq(users.status, 'ACTIVE'),
    )).limit(1);
    if (!teacher) throw new Error('TEACHER_NOT_FOUND');

    if (data.assignedHomeworkId) {
      await this.getAssignment(userId, data.assignedHomeworkId);
    }

    const [profile] = await db.select().from(studentProfiles)
      .where(eq(studentProfiles.userId, userId)).limit(1);
    const specificCredits = data.sessionFormat === 'PRIVATE'
      ? (profile?.remainingPrivateCredits ?? 0)
      : (profile?.remainingGroupCredits ?? 0);
    const creditField = specificCredits > 0
      ? (data.sessionFormat === 'PRIVATE' ? 'remainingPrivateCredits' : 'remainingGroupCredits')
      : 'remainingCredits';
    const availableCredits = specificCredits > 0 ? specificCredits : (profile?.remainingCredits ?? 0);
    if (availableCredits < 1) throw new Error('INSUFFICIENT_CREDITS');

    return db.transaction(async (transaction) => {
      const creditColumn = studentProfiles[creditField];
      const [updatedProfile] = await transaction.update(studentProfiles)
        .set({ [creditField]: sql`${creditColumn} - 1` })
        .where(and(eq(studentProfiles.userId, userId), gt(creditColumn, 0)))
        .returning();
      if (!updatedProfile) throw new Error('INSUFFICIENT_CREDITS');

      const [session] = await transaction.insert(bookingSessions).values({
        ...data,
        studentId: userId,
        date: data.date,
        status: 'SCHEDULED',
      }).returning();
      return session;
    });
  }

  async rescheduleSession(userId: number, sessionId: number, data: RescheduleSessionInput) {
    if (data.date <= new Date()) throw new Error('SESSION_DATE_INVALID');
    const [session] = await db.update(bookingSessions).set({
      date: data.date,
      time: data.time,
      status: 'RESCHEDULED',
    }).where(and(
      eq(bookingSessions.id, sessionId),
      eq(bookingSessions.studentId, userId),
      eq(bookingSessions.status, 'SCHEDULED'),
    )).returning();
    if (!session) throw new Error('SESSION_NOT_FOUND');
    return session;
  }

  async cancelSession(userId: number, sessionId: number) {
    const [session] = await db.update(bookingSessions).set({ status: 'CANCELLED' })
      .where(and(
        eq(bookingSessions.id, sessionId),
        eq(bookingSessions.studentId, userId),
        eq(bookingSessions.status, 'SCHEDULED'),
      )).returning();
    if (!session) throw new Error('SESSION_NOT_FOUND');
    return session;
  }

  async getNotifications(userId: number, input: ListInput) {
    const condition = eq(notifications.userId, userId);
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(notifications).where(condition).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(notifications).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async markNotificationRead(userId: number, notificationId: number) {
    const [notification] = await db.update(notifications).set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning();
    if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
    return notification;
  }

  async getResources(input: ListInput) {
    const condition = input.search
      ? sql`lower(${resources.title}) like ${`%${input.search.toLowerCase()}%`}`
      : undefined;
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(resources).where(condition).orderBy(desc(resources.uploadDate)).limit(limit).offset(offset),
      db.select({ total: count() }).from(resources).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getPayments(userId: number, input: ListInput) {
    const condition = and(
      eq(paymentProofs.studentId, userId),
      input.status ? eq(paymentProofs.status, input.status as 'PENDING' | 'APPROVED' | 'REJECTED') : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(paymentProofs).where(condition).orderBy(desc(paymentProofs.submittedAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(paymentProofs).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async createPayment(userId: number, data: CreatePaymentInput) {
    const [payment] = await db.insert(paymentProofs).values({
      ...data,
      studentId: userId,
      amount: String(data.amount),
      status: 'PENDING',
    }).returning();
    return payment;
  }

  async getReviews(userId: number) {
    return db.select().from(reviews).where(eq(reviews.studentId, userId)).orderBy(desc(reviews.createdAt));
  }

  async createReview(userId: number, data: CreateReviewInput) {
    const [review] = await db.insert(reviews).values({ ...data, studentId: userId, status: 'PENDING' }).returning();
    return review;
  }
}

export const studentService = new StudentService();