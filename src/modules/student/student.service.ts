import { and, desc, eq, or, sql } from 'drizzle-orm';
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
  UpdateProfileInput,
} from './student.schema.js';

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
  async getDashboard(userId: number) {
    const [profile, assignmentList, sessionList, notificationList, submissionList] = await Promise.all([
      this.getProfile(userId),
      this.getAssignments(userId),
      this.getSessions(userId),
      this.getNotifications(userId),
      this.getSubmissions(userId),
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

  async getAssignments(userId: number) {
    return db.select().from(assignments).where(or(
      eq(assignments.studentId, userId),
      sql`${assignments.assignedStudentIds} @> ${JSON.stringify([userId])}::jsonb`,
    )).orderBy(desc(assignments.createdAt));
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

  async getSubmissions(userId: number) {
    return db.select().from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.studentId, userId))
      .orderBy(desc(homeworkSubmissions.submittedAt));
  }

  async createSubmission(userId: number, assignmentId: number, data: CreateSubmissionInput) {
    await this.getAssignment(userId, assignmentId);
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

  async getSessions(userId: number) {
    return db.select().from(bookingSessions).where(and(
      eq(bookingSessions.studentId, userId),
      eq(bookingSessions.isArchived, false),
    )).orderBy(desc(bookingSessions.date));
  }

  async createSession(userId: number, data: CreateSessionInput) {
    const [session] = await db.insert(bookingSessions).values({
      ...data,
      studentId: userId,
      date: data.date,
      status: 'SCHEDULED',
    }).returning();
    return session;
  }

  async getNotifications(userId: number) {
    return db.select().from(notifications).where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(userId: number, notificationId: number) {
    const [notification] = await db.update(notifications).set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning();
    if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
    return notification;
  }

  async getResources() {
    return db.select().from(resources).orderBy(desc(resources.uploadDate));
  }

  async getPayments(userId: number) {
    return db.select().from(paymentProofs).where(eq(paymentProofs.studentId, userId))
      .orderBy(desc(paymentProofs.submittedAt));
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