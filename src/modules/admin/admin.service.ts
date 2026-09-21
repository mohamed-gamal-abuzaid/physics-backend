import { and, desc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { appSettings } from '../../db/models/app-settings.js';
import { assignments } from '../../db/models/assignments.js';
import { auditLogs } from '../../db/models/audit-logs.js';
import { bookingSessions } from '../../db/models/booking-sessions.js';
import { homeworkSubmissions } from '../../db/models/homework-submissions.js';
import { paymentProofs } from '../../db/models/payment-proofs.js';
import { resources } from '../../db/models/resources.js';
import { users } from '../../db/models/users.js';
import {
  assignmentSchema,
  gradeSchema,
  paymentReviewSchema,
  resourceSchema,
  sessionStatusSchema,
  settingsSchema,
  updateUserSchema,
} from './admin.schema.js';

type UserUpdate = z.infer<typeof updateUserSchema>;
type AssignmentInput = z.infer<typeof assignmentSchema>;
type GradeInput = z.infer<typeof gradeSchema>;
type SessionStatusInput = z.infer<typeof sessionStatusSchema>;
type PaymentReviewInput = z.infer<typeof paymentReviewSchema>;
type ResourceInput = z.infer<typeof resourceSchema>;
type SettingsInput = z.infer<typeof settingsSchema>;

export class AdminService {
  async listUsers(search?: string) {
    return db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, status: users.status, createdAt: users.createdAt,
    }).from(users).where(search ? ilike(users.email, `%${search}%`) : undefined).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, data: UserUpdate) {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id)).returning();
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
  }

  async listAssignments() { return db.select().from(assignments).orderBy(desc(assignments.createdAt)); }

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

  async listSubmissions() { return db.select().from(homeworkSubmissions).orderBy(desc(homeworkSubmissions.submittedAt)); }

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

  async listSessions() { return db.select().from(bookingSessions).orderBy(desc(bookingSessions.date)); }

  async updateSession(id: number, data: SessionStatusInput) {
    const [session] = await db.update(bookingSessions).set(data).where(eq(bookingSessions.id, id)).returning();
    if (!session) throw new Error('SESSION_NOT_FOUND');
    return session;
  }

  async listPayments() { return db.select().from(paymentProofs).orderBy(desc(paymentProofs.submittedAt)); }

  async reviewPayment(id: number, adminId: number, data: PaymentReviewInput) {
    const [payment] = await db.update(paymentProofs).set({
      status: data.status,
      notes: data.notes,
      rejectionReason: data.rejectionReason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    }).where(eq(paymentProofs.id, id)).returning();
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    return payment;
  }

  async listResources() { return db.select().from(resources).orderBy(desc(resources.uploadDate)); }

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