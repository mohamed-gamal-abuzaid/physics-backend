import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { appSettings } from '../../db/models/app-settings.js';
import { assignments } from '../../db/models/assignments.js';
import { auditLogs } from '../../db/models/audit-logs.js';
import { bookingSessions } from '../../db/models/booking-sessions.js';
import { homeworkSubmissions } from '../../db/models/homework-submissions.js';
import { paymentProofs } from '../../db/models/payment-proofs.js';
import { resources } from '../../db/models/resources.js';
import { studentProfiles, users } from '../../db/models/users.js';
import {
  assignmentSchema,
  gradeSchema,
  paymentReviewSchema,
  resourceSchema,
  sessionStatusSchema,
  settingsSchema,
  updateUserSchema,
  listSchema,
} from './admin.schema.js';
import { getPagination, paginated } from '../../utils/pagination.js';

type UserUpdate = z.infer<typeof updateUserSchema>;
type AssignmentInput = z.infer<typeof assignmentSchema>;
type GradeInput = z.infer<typeof gradeSchema>;
type SessionStatusInput = z.infer<typeof sessionStatusSchema>;
type PaymentReviewInput = z.infer<typeof paymentReviewSchema>;
type ResourceInput = z.infer<typeof resourceSchema>;
type SettingsInput = z.infer<typeof settingsSchema>;

export class AdminService {
  async listUsers(input: z.infer<typeof listSchema>) {
    const condition = and(
      input.search ? ilike(users.email, `%${input.search}%`) : undefined,
      input.role ? eq(users.role, input.role) : undefined,
      input.status ? eq(users.status, input.status) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, status: users.status, createdAt: users.createdAt,
    }).from(users).where(condition).orderBy(desc(users.createdAt)).limit(limit).offset(offset), db.select({ total: count() }).from(users).where(condition)]);
    return paginated(items, input.page, input.limit, total);
  }

  async updateUser(id: number, data: UserUpdate) {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id)).returning();
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
  }

  async listAssignments(input: z.infer<typeof listSchema>) {
    const condition = input.search ? ilike(assignments.title, `%${input.search}%`) : undefined;
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([db.select().from(assignments).where(condition).orderBy(desc(assignments.createdAt)).limit(limit).offset(offset), db.select({ total: count() }).from(assignments).where(condition)]);
    return paginated(items, input.page, input.limit, total);
  }

  async createAssignment(data: AssignmentInput) {
    const [assignment] = await db.insert(assignments).values(data).returning();
    return assignment;
  }

  async updateAssignment(id: number, data: Partial<AssignmentInput>) {
    const [assignment] = await db.update(assignments).set(data).where(eq(assignments.id, id)).returning();
    if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND');
    return assignment;
  }

  async deleteAssignment(id: number) {
    const [assignment] = await db.delete(assignments).where(eq(assignments.id, id)).returning({ id: assignments.id });
    if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND');
  }

  async listSubmissions(input: z.infer<typeof listSchema>) {
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([db.select().from(homeworkSubmissions).orderBy(desc(homeworkSubmissions.submittedAt)).limit(limit).offset(offset), db.select({ total: count() }).from(homeworkSubmissions)]);
    return paginated(items, input.page, input.limit, total);
  }

  async gradeSubmission(id: number, data: GradeInput) {
    const [submission] = await db.update(homeworkSubmissions).set({
      ...data,
      score: data.score === undefined ? undefined : String(data.score),
      status: 'GRADED',
      gradedAt: new Date(),
    }).where(eq(homeworkSubmissions.id, id)).returning();
    if (!submission) throw new Error('SUBMISSION_NOT_FOUND');
    return submission;
  }

  async listSessions(input: z.infer<typeof listSchema>) {
    const condition = input.status ? eq(bookingSessions.status, input.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED') : undefined;
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([db.select().from(bookingSessions).where(condition).orderBy(desc(bookingSessions.date)).limit(limit).offset(offset), db.select({ total: count() }).from(bookingSessions).where(condition)]);
    return paginated(items, input.page, input.limit, total);
  }

  async updateSession(id: number, data: SessionStatusInput) {
    const [session] = await db.update(bookingSessions).set(data).where(eq(bookingSessions.id, id)).returning();
    if (!session) throw new Error('SESSION_NOT_FOUND');
    return session;
  }

  async listPayments(input: z.infer<typeof listSchema>) {
    const condition = input.status ? eq(paymentProofs.status, input.status as 'PENDING' | 'APPROVED' | 'REJECTED') : undefined;
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([db.select().from(paymentProofs).where(condition).orderBy(desc(paymentProofs.submittedAt)).limit(limit).offset(offset), db.select({ total: count() }).from(paymentProofs).where(condition)]);
    return paginated(items, input.page, input.limit, total);
  }

  async reviewPayment(id: number, adminId: number, data: PaymentReviewInput) {
    return db.transaction(async (transaction) => {
      const [current] = await transaction.select().from(paymentProofs)
        .where(eq(paymentProofs.id, id)).limit(1);
      if (!current) throw new Error('PAYMENT_NOT_FOUND');
      if (current.status === 'APPROVED') throw new Error('PAYMENT_ALREADY_REVIEWED');

      const [payment] = await transaction.update(paymentProofs).set({
        status: data.status,
        notes: data.notes,
        rejectionReason: data.rejectionReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      }).where(eq(paymentProofs.id, id)).returning();

      if (data.status === 'APPROVED' && current.sessionsCount && current.sessionsCount > 0) {
        const creditType = (current.creditType || '').toUpperCase();
        const changes = creditType === 'PRIVATE'
          ? { remainingPrivateCredits: sql`${studentProfiles.remainingPrivateCredits} + ${current.sessionsCount}` }
          : creditType === 'GROUP'
            ? { remainingGroupCredits: sql`${studentProfiles.remainingGroupCredits} + ${current.sessionsCount}` }
            : { remainingCredits: sql`${studentProfiles.remainingCredits} + ${current.sessionsCount}` };
        await transaction.update(studentProfiles).set(changes).where(eq(studentProfiles.userId, current.studentId));
      }

      return payment;
    });
  }

  async listResources(input: z.infer<typeof listSchema>) {
    const condition = input.search ? ilike(resources.title, `%${input.search}%`) : undefined;
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([db.select().from(resources).where(condition).orderBy(desc(resources.uploadDate)).limit(limit).offset(offset), db.select({ total: count() }).from(resources).where(condition)]);
    return paginated(items, input.page, input.limit, total);
  }

  async createResource(data: ResourceInput) {
    const [resource] = await db.insert(resources).values(data).returning();
    return resource;
  }

  async updateResource(id: number, data: Partial<ResourceInput>) {
    const [resource] = await db.update(resources).set(data).where(eq(resources.id, id)).returning();
    if (!resource) throw new Error('RESOURCE_NOT_FOUND');
    return resource;
  }

  async deleteResource(id: number) {
    const [resource] = await db.delete(resources).where(eq(resources.id, id)).returning({ id: resources.id });
    if (!resource) throw new Error('RESOURCE_NOT_FOUND');
  }

  async getSettings() {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || null;
  }

  async updateSettings(data: SettingsInput) {
    const existing = await this.getSettings();
    if (existing) {
      const [settings] = await db.update(appSettings).set({ ...data, updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id)).returning();
      return settings;
    }
    const [settings] = await db.insert(appSettings).values(data).returning();
    return settings;
  }

  async writeAuditLog(actorId: number, action: string, details: unknown) {
    await db.insert(auditLogs).values({ actorId, actorRole: 'ADMIN', action, details });
  }
}

export const adminService = new AdminService();