import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { appSettings } from '../../db/models/app-settings.js';
import { assignments } from '../../db/models/assignments.js';
import { auditLogs } from '../../db/models/audit-logs.js';
import { bookingSessions } from '../../db/models/booking-sessions.js';
import { campaigns } from '../../db/models/campaigns.js';
import { hallOfFame } from '../../db/models/hall-of-fame.js';
import { homeworkSubmissions } from '../../db/models/homework-submissions.js';
import { invoices } from '../../db/models/invoices.js';
import { notifications } from '../../db/models/notifications.js';
import { outboxEmails } from '../../db/models/outbox-emails.js';
import { paymentProofs } from '../../db/models/payment-proofs.js';
import { resources } from '../../db/models/resources.js';
import { reviews } from '../../db/models/reviews.js';
import { tickets, TicketMessage } from '../../db/models/tickets.js';
import { studentProfiles, users } from '../../db/models/users.js';
import { hashPassword } from '../../utils/auth.js';
import {
  addStudentAccountSchema,
  adjustCreditsSchema,
  adminTicketMessageSchema,
  assignmentSchema,
  assignScholarSchema,
  campaignSchema,
  completeSessionSchema,
  createInvoiceSchema,
  crmListSchema,
  gradeSchema,
  hallOfFameSchema,
  listSchema,
  paymentReviewSchema,
  resourceListSchema,
  resourceSchema,
  reviewModerationSchema,
  sessionStatusSchema,
  settingsSchema,
  updateInvoiceStatusSchema,
  updateStudentStatusSchema,
  updateTicketSchema,
  updateUserSchema,
} from './admin.schema.js';
import { getPagination, paginated } from '../../utils/pagination.js';

type UserUpdate = z.infer<typeof updateUserSchema>;
type AssignmentInput = z.infer<typeof assignmentSchema>;
type GradeInput = z.infer<typeof gradeSchema>;
type SessionStatusInput = z.infer<typeof sessionStatusSchema>;
type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
type PaymentReviewInput = z.infer<typeof paymentReviewSchema>;
type ResourceInput = z.infer<typeof resourceSchema>;
type ResourceListAdminInput = z.infer<typeof resourceListSchema>;
type SettingsInput = z.infer<typeof settingsSchema>;
type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
type AdjustCreditsInput = z.infer<typeof adjustCreditsSchema>;
type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
type AdminTicketMessageInput = z.infer<typeof adminTicketMessageSchema>;
type AddStudentAccountInput = z.infer<typeof addStudentAccountSchema>;
type AssignScholarInput = z.infer<typeof assignScholarSchema>;
type CrmListInput = z.infer<typeof crmListSchema>;
type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;
type HallOfFameInput = z.infer<typeof hallOfFameSchema>;
type CampaignInput = z.infer<typeof campaignSchema>;

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
    const teachers = alias(users, 'teachers');
    const condition = and(
      input.status ? eq(bookingSessions.status, input.status as any) : undefined,
      input.search ? or(
        ilike(bookingSessions.topic, `%${input.search}%`),
        ilike(bookingSessions.courseName, `%${input.search}%`),
        ilike(users.name, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
      ) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: bookingSessions.id,
        studentId: bookingSessions.studentId,
        studentName: users.name,
        studentEmail: users.email,
        teacherId: bookingSessions.teacherId,
        teacherName: teachers.name,
        assignedHomeworkId: bookingSessions.assignedHomeworkId,
        courseName: bookingSessions.courseName,
        topic: bookingSessions.topic,
        sessionFormat: bookingSessions.sessionFormat,
        date: bookingSessions.date,
        time: bookingSessions.time,
        durationMinutes: bookingSessions.durationMinutes,
        location: bookingSessions.location,
        status: bookingSessions.status,
        meetingLink: bookingSessions.meetingLink,
        notes: bookingSessions.notes,
        sessionNotes: bookingSessions.sessionNotes,
        createdAt: bookingSessions.createdAt,
      })
      .from(bookingSessions)
      .leftJoin(users, eq(bookingSessions.studentId, users.id))
      .leftJoin(teachers, eq(bookingSessions.teacherId, teachers.id))
      .where(condition)
      .orderBy(desc(bookingSessions.date))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(bookingSessions)
        .leftJoin(users, eq(bookingSessions.studentId, users.id))
        .where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async updateSession(id: number, data: SessionStatusInput) {
    const [session] = await db.update(bookingSessions).set(data).where(eq(bookingSessions.id, id)).returning();
    if (!session) throw new Error('SESSION_NOT_FOUND');
    return session;
  }

  async completeSession(id: number, adminId: number, data: CompleteSessionInput) {
    const [existingSession] = await db.select().from(bookingSessions).where(eq(bookingSessions.id, id)).limit(1);
    if (!existingSession) throw new Error('SESSION_NOT_FOUND');

    return db.transaction(async (tx) => {
      let assignedHomeworkId = data.assignedHomeworkId;
      if (data.assignedHomework) {
        const [createdAssignment] = await tx.insert(assignments).values({
          title: data.assignedHomework.title,
          dueDate: data.assignedHomework.dueDate,
          totalPoints: data.assignedHomework.totalPoints,
          description: data.assignedHomework.description,
          studentId: existingSession.studentId,
          course: existingSession.courseName ?? undefined,
          module: existingSession.topic ?? undefined,
        }).returning();
        assignedHomeworkId = createdAssignment.id;
      }

      const [completedSession] = await tx
        .update(bookingSessions)
        .set({
          status: 'COMPLETED',
          sessionNotes: data.sessionNotes !== undefined ? data.sessionNotes : existingSession.sessionNotes,
          notes: data.notes !== undefined ? data.notes : existingSession.notes,
          assignedHomeworkId: assignedHomeworkId !== undefined ? assignedHomeworkId : existingSession.assignedHomeworkId,
        })
        .where(eq(bookingSessions.id, id))
        .returning();

      await tx.insert(auditLogs).values({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'COMPLETE_SESSION',
        details: { sessionId: id, studentId: existingSession.studentId, assignedHomeworkId },
      });

      await tx.insert(notifications).values({
        userId: existingSession.studentId,
        title: 'Session Completed & Summary Ready',
        message: `Your session on "${existingSession.topic || existingSession.courseName || 'Physics'}" has been completed! Session notes, whiteboard snapshots, and homework are now available.`,
        type: 'academic',
        linkTab: 'academic',
      });

      return completedSession;
    });
  }

  async approveSession(id: number, adminId: number) {
    const [existing] = await db.select().from(bookingSessions).where(eq(bookingSessions.id, id)).limit(1);
    if (!existing) throw new Error('SESSION_NOT_FOUND');

    const [session] = await db
      .update(bookingSessions)
      .set({ status: 'APPROVED' })
      .where(eq(bookingSessions.id, id))
      .returning();

    await db.insert(auditLogs).values({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'APPROVE_SESSION',
      details: { sessionId: id, studentId: existing.studentId },
    });

    await db.insert(notifications).values({
      userId: existing.studentId,
      title: 'Session Booking Confirmed',
      message: `Your session booking on ${new Date(existing.date).toLocaleDateString()} has been approved and confirmed.`,
      type: 'academic',
      linkTab: 'academic',
    });

    return session;
  }

  async rejectSession(id: number, adminId: number, reason?: string) {
    const [existing] = await db.select().from(bookingSessions).where(eq(bookingSessions.id, id)).limit(1);
    if (!existing) throw new Error('SESSION_NOT_FOUND');

    return db.transaction(async (tx) => {
      const [session] = await tx
        .update(bookingSessions)
        .set({
          status: 'CANCELLED',
          notes: reason ? (existing.notes ? `${existing.notes} | Cancellation reason: ${reason}` : reason) : existing.notes,
        })
        .where(eq(bookingSessions.id, id))
        .returning();

      const creditField = existing.sessionFormat === 'PRIVATE' ? 'remainingPrivateCredits' : 'remainingGroupCredits';
      const targetCol = studentProfiles[creditField];
      await tx
        .update(studentProfiles)
        .set({
          [creditField]: sql`${targetCol} + 1`,
          totalCredits: sql`${studentProfiles.totalCredits} + 1`,
        })
        .where(eq(studentProfiles.userId, existing.studentId));

      await tx.insert(auditLogs).values({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'REJECT_SESSION',
        details: { sessionId: id, studentId: existing.studentId, reason },
      });

      await tx.insert(notifications).values({
        userId: existing.studentId,
        title: 'Session Booking Cancelled',
        message: `Your session booking on ${new Date(existing.date).toLocaleDateString()} was cancelled${reason ? `: ${reason}` : '.'} Your session credit has been refunded.`,
        type: 'academic',
        linkTab: 'academic',
      });

      return session;
    });
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
          ? { remainingPrivateCredits: sql`${studentProfiles.remainingPrivateCredits} + ${current.sessionsCount}`, totalCredits: sql`${studentProfiles.totalCredits} + ${current.sessionsCount}` }
          : creditType === 'GROUP'
            ? { remainingGroupCredits: sql`${studentProfiles.remainingGroupCredits} + ${current.sessionsCount}`, totalCredits: sql`${studentProfiles.totalCredits} + ${current.sessionsCount}` }
            : { remainingCredits: sql`${studentProfiles.remainingCredits} + ${current.sessionsCount}`, totalCredits: sql`${studentProfiles.totalCredits} + ${current.sessionsCount}` };
        await transaction.update(studentProfiles).set(changes).where(eq(studentProfiles.userId, current.studentId));

        const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
        await transaction.insert(invoices).values({
          invoiceNumber,
          studentId: current.studentId,
          packageName: current.packageName,
          amount: current.amount,
          status: 'PAID',
          paymentMethod: current.paymentMethod,
          paidAt: new Date(),
          referenceNote: current.transactionRef ? `Proof Ref: ${current.transactionRef}` : undefined,
        });

        await transaction.insert(notifications).values({
          userId: current.studentId,
          title: 'Payment Proof Approved',
          message: `Your payment of ${current.amount} for package "${current.packageName || 'Top-Up'}" has been approved!`,
          type: 'financial',
          linkTab: 'financials',
        });
      }

      return payment;
    });
  }

  async listInvoices(input: z.infer<typeof listSchema>) {
    const condition = and(
      input.status ? eq(invoices.status, input.status as 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED') : undefined,
      input.search ? or(
        ilike(invoices.invoiceNumber, `%${input.search}%`),
        ilike(invoices.packageName, `%${input.search}%`),
        ilike(users.name, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
      ) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        studentId: invoices.studentId,
        studentName: users.name,
        studentEmail: users.email,
        parentName: invoices.parentName,
        packageName: invoices.packageName,
        amount: invoices.amount,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        paymentMethod: invoices.paymentMethod,
        paidAt: invoices.paidAt,
        referenceNote: invoices.referenceNote,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(users, eq(invoices.studentId, users.id))
      .where(condition)
      .orderBy(desc(invoices.issueDate))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(invoices)
        .leftJoin(users, eq(invoices.studentId, users.id))
        .where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getInvoice(id: number) {
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        studentId: invoices.studentId,
        studentName: users.name,
        studentEmail: users.email,
        parentName: invoices.parentName,
        packageName: invoices.packageName,
        amount: invoices.amount,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        paymentMethod: invoices.paymentMethod,
        paidAt: invoices.paidAt,
        referenceNote: invoices.referenceNote,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(users, eq(invoices.studentId, users.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    return invoice;
  }

  async createInvoice(data: CreateInvoiceInput) {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...data,
        invoiceNumber,
        amount: String(data.amount),
        paidAt: data.status === 'PAID' ? new Date() : undefined,
      })
      .returning();

    return invoice;
  }

  async updateInvoiceStatus(id: number, data: UpdateInvoiceStatusInput) {
    const [invoice] = await db
      .update(invoices)
      .set({
        status: data.status,
        paymentMethod: data.paymentMethod,
        referenceNote: data.referenceNote,
        paidAt: data.status === 'PAID' ? (data.paidAt || new Date()) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    return invoice;
  }

  async adjustCredits(studentId: number, adminId: number, data: AdjustCreditsInput) {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student) throw new Error('USER_NOT_FOUND');

    return db.transaction(async (tx) => {
      const [profile] = await tx.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId)).limit(1);
      if (!profile) {
        await tx.insert(studentProfiles).values({ userId: studentId });
      }

      const creditField = data.creditType === '1-to-1'
        ? 'remainingPrivateCredits'
        : data.creditType === 'group'
          ? 'remainingGroupCredits'
          : 'remainingCredits';

      const targetCol = studentProfiles[creditField];
      const updates: Record<string, any> = {
        [creditField]: sql`GREATEST(0, ${targetCol} + ${data.amount})`,
      };
      if (data.amount > 0) {
        updates.totalCredits = sql`${studentProfiles.totalCredits} + ${data.amount}`;
      }

      const [updatedProfile] = await tx
        .update(studentProfiles)
        .set(updates)
        .where(eq(studentProfiles.userId, studentId))
        .returning();

      await tx.insert(auditLogs).values({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'ADJUST_CREDITS',
        details: { studentId, ...data },
      });

      await tx.insert(notifications).values({
        userId: studentId,
        title: 'Credits Adjusted',
        message: `Your account credits have been adjusted by administration: ${data.amount > 0 ? '+' : ''}${data.amount} (${data.creditType} credits). Reason: ${data.reason}`,
        type: 'financial',
        linkTab: 'financials',
      });

      return updatedProfile;
    });
  }

  async listTickets(input: z.infer<typeof listSchema>) {
    const condition = and(
      input.status ? eq(tickets.status, input.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') : undefined,
      input.search ? or(
        ilike(tickets.ticketNumber, `%${input.search}%`),
        ilike(tickets.subject, `%${input.search}%`),
        ilike(tickets.category, `%${input.search}%`),
        ilike(users.name, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
      ) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        studentId: tickets.studentId,
        studentName: users.name,
        studentEmail: users.email,
        requesterRole: tickets.requesterRole,
        subject: tickets.subject,
        category: tickets.category,
        priority: tickets.priority,
        status: tickets.status,
        messages: tickets.messages,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.studentId, users.id))
      .where(condition)
      .orderBy(desc(tickets.updatedAt))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(tickets)
        .leftJoin(users, eq(tickets.studentId, users.id))
        .where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getTicket(id: number) {
    const [ticket] = await db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        studentId: tickets.studentId,
        studentName: users.name,
        studentEmail: users.email,
        requesterRole: tickets.requesterRole,
        subject: tickets.subject,
        category: tickets.category,
        priority: tickets.priority,
        status: tickets.status,
        messages: tickets.messages,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.studentId, users.id))
      .where(eq(tickets.id, id))
      .limit(1);

    if (!ticket) throw new Error('TICKET_NOT_FOUND');
    return ticket;
  }

  async replyTicket(ticketId: number, adminId: number, data: AdminTicketMessageInput) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!ticket) throw new Error('TICKET_NOT_FOUND');

    const [adminUser] = await db.select({ name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, adminId)).limit(1);
    const replyMessage: TicketMessage = {
      id: randomUUID(),
      sender: adminUser?.name || 'Staff',
      role: 'staff',
      text: data.text,
      timestamp: new Date().toISOString(),
      avatar: adminUser?.avatar || undefined,
    };

    const updatedMessages = [...(ticket.messages || []), replyMessage];
    const newStatus = ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status;

    const [updatedTicket] = await db
      .update(tickets)
      .set({
        messages: updatedMessages,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    await db.insert(notifications).values({
      userId: ticket.studentId,
      title: 'Ticket Reply Received',
      message: `Staff replied to your ticket ${ticket.ticketNumber}: "${ticket.subject}"`,
      type: 'crm',
      linkTab: 'crm',
    });

    return updatedTicket;
  }

  async updateTicket(id: number, data: UpdateTicketInput) {
    const [ticket] = await db
      .update(tickets)
      .set({
        status: data.status,
        priority: data.priority,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    if (!ticket) throw new Error('TICKET_NOT_FOUND');
    return ticket;
  }

  async listResources(input: ResourceListAdminInput) {
    const condition = and(
      input.search ? ilike(resources.title, `%${input.search}%`) : undefined,
      input.category ? eq(resources.category, input.category) : undefined,
      input.course ? eq(resources.course, input.course) : undefined,
      input.topic ? eq(resources.topic, input.topic) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(resources).where(condition).orderBy(desc(resources.uploadDate)).limit(limit).offset(offset),
      db.select({ total: count() }).from(resources).where(condition),
    ]);
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

  async listReviews(input: z.infer<typeof listSchema>) {
    const condition = and(
      input.status ? eq(reviews.status, input.status as any) : undefined,
      input.search ? or(
        ilike(reviews.name, `%${input.search}%`),
        ilike(reviews.content, `%${input.search}%`),
        ilike(reviews.cohort, `%${input.search}%`),
      ) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: reviews.id,
        studentId: reviews.studentId,
        studentEmail: users.email,
        name: reviews.name,
        cohort: reviews.cohort,
        content: reviews.content,
        rating: reviews.rating,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.studentId, users.id))
      .where(condition)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(reviews)
        .leftJoin(users, eq(reviews.studentId, users.id))
        .where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async moderateReview(id: number, data: ReviewModerationInput) {
    const [review] = await db
      .update(reviews)
      .set(data)
      .where(eq(reviews.id, id))
      .returning();
    if (!review) throw new Error('REVIEW_NOT_FOUND');
    return review;
  }

  async deleteReview(id: number) {
    const [review] = await db.delete(reviews).where(eq(reviews.id, id)).returning({ id: reviews.id });
    if (!review) throw new Error('REVIEW_NOT_FOUND');
  }

  async listHallOfFame(input: z.infer<typeof listSchema>) {
    const condition = input.search ? or(
      ilike(hallOfFame.studentName, `%${input.search}%`),
      ilike(hallOfFame.admittedUniversity, `%${input.search}%`),
      ilike(hallOfFame.curriculum, `%${input.search}%`),
      ilike(hallOfFame.majorField, `%${input.search}%`),
      ilike(hallOfFame.quote, `%${input.search}%`),
      ilike(hallOfFame.superlativeBadge, `%${input.search}%`),
    ) : undefined;
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(hallOfFame).where(condition).orderBy(desc(hallOfFame.graduationDate)).limit(limit).offset(offset),
      db.select({ total: count() }).from(hallOfFame).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getHallOfFame(id: number) {
    const [item] = await db.select().from(hallOfFame).where(eq(hallOfFame.id, id)).limit(1);
    if (!item) throw new Error('HALL_OF_FAME_NOT_FOUND');
    return item;
  }

  async createHallOfFame(data: HallOfFameInput) {
    const certificateId = data.certificateId || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [item] = await db
      .insert(hallOfFame)
      .values({
        ...data,
        honors: Array.isArray(data.honors) ? data.honors.join(', ') : data.honors,
        certificateId,
      })
      .returning();
    return item;
  }

  async updateHallOfFame(id: number, data: Partial<HallOfFameInput>) {
    const [item] = await db
      .update(hallOfFame)
      .set({
        ...data,
        honors: Array.isArray(data.honors) ? data.honors.join(', ') : data.honors,
      })
      .where(eq(hallOfFame.id, id))
      .returning();
    if (!item) throw new Error('HALL_OF_FAME_NOT_FOUND');
    return item;
  }

  async deleteHallOfFame(id: number) {
    const [item] = await db.delete(hallOfFame).where(eq(hallOfFame.id, id)).returning({ id: hallOfFame.id });
    if (!item) throw new Error('HALL_OF_FAME_NOT_FOUND');
  }

  async listCampaigns(input: z.infer<typeof listSchema>) {
    const condition = and(
      input.status ? eq(campaigns.status, input.status as any) : undefined,
      input.search ? or(
        ilike(campaigns.title, `%${input.search}%`),
        ilike(campaigns.subject, `%${input.search}%`),
      ) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(campaigns).where(condition).orderBy(desc(campaigns.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(campaigns).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async createCampaign(data: CampaignInput) {
    const [campaign] = await db.insert(campaigns).values(data).returning();
    return campaign;
  }

  async updateCampaign(id: number, data: Partial<CampaignInput>) {
    const [campaign] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
    if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');
    return campaign;
  }

  async deleteCampaign(id: number) {
    const [campaign] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning({ id: campaigns.id });
    if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');
  }

  async sendCampaign(id: number, adminId: number) {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');

    const students = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.role, 'STUDENT'), eq(users.status, 'Active')));

    return db.transaction(async (tx) => {
      const [updatedCampaign] = await tx
        .update(campaigns)
        .set({
          status: 'SENT',
          sentAt: new Date(),
          recipientCount: students.length,
          openRate: '0.00',
          clickRate: '0.00',
        })
        .where(eq(campaigns.id, id))
        .returning();

      if (students.length > 0) {
        const outboxEntries = students.map((s) => ({
          studentId: s.id,
          recipientEmail: s.email,
          subject: campaign.subject,
          body: campaign.previewSnippet || campaign.title,
          status: 'DELIVERED',
          provider: 'SES / Resend',
          sentAt: new Date(),
        }));
        await tx.insert(outboxEmails).values(outboxEntries);
      }

      await tx.insert(auditLogs).values({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'SEND_CAMPAIGN',
        details: { campaignId: id, recipientCount: students.length },
      });

      return {
        campaign: updatedCampaign,
        recipientsDispatched: students.length,
        message: `Campaign dispatched to ${students.length} active scholars.`,
      };
    });
  }

  async listOutbox(input: z.infer<typeof listSchema>) {
    const condition = and(
      input.status ? eq(outboxEmails.status, input.status) : undefined,
      input.search ? or(
        ilike(outboxEmails.recipientEmail, `%${input.search}%`),
        ilike(outboxEmails.subject, `%${input.search}%`),
        ilike(users.name, `%${input.search}%`),
      ) : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: outboxEmails.id,
        studentId: outboxEmails.studentId,
        studentName: users.name,
        recipientEmail: outboxEmails.recipientEmail,
        subject: outboxEmails.subject,
        body: outboxEmails.body,
        sentAt: outboxEmails.sentAt,
        status: outboxEmails.status,
        provider: outboxEmails.provider,
        error: outboxEmails.error,
      })
      .from(outboxEmails)
      .leftJoin(users, eq(outboxEmails.studentId, users.id))
      .where(condition)
      .orderBy(desc(outboxEmails.sentAt))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(outboxEmails)
        .leftJoin(users, eq(outboxEmails.studentId, users.id))
        .where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
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

  async listCrmStudents(input: CrmListInput) {
    const teachers = alias(users, 'teachers');
    const condition = and(
      eq(users.role, 'STUDENT'),
      input.status ? eq(users.status, input.status) : undefined,
      input.cohort ? eq(studentProfiles.cohort, input.cohort) : undefined,
      input.teacherId ? eq(studentProfiles.assignedTeacherId, input.teacherId) : undefined,
      input.registeredVia ? eq(studentProfiles.registeredVia, input.registeredVia) : undefined,
      input.search ? or(
        ilike(users.name, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
        ilike(users.phone, `%${input.search}%`),
        ilike(studentProfiles.parentName, `%${input.search}%`),
      ) : undefined,
    );

    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        status: users.status,
        createdAt: users.createdAt,
        parentName: studentProfiles.parentName,
        parentEmail: studentProfiles.parentEmail,
        parentPhone: studentProfiles.parentPhone,
        gradeLevel: studentProfiles.gradeLevel,
        cohort: studentProfiles.cohort,
        totalCredits: studentProfiles.totalCredits,
        remainingCredits: studentProfiles.remainingCredits,
        remainingPrivateCredits: studentProfiles.remainingPrivateCredits,
        remainingGroupCredits: studentProfiles.remainingGroupCredits,
        attendanceRate: studentProfiles.attendanceRate,
        averageScore: studentProfiles.averageScore,
        enrolledCourse: studentProfiles.enrolledCourse,
        schoolName: studentProfiles.schoolName,
        academicYear: studentProfiles.academicYear,
        examBoard: studentProfiles.examBoard,
        examSession: studentProfiles.examSession,
        hardestTopic: studentProfiles.hardestTopic,
        meetingLink: studentProfiles.meetingLink,
        isAccountGranted: studentProfiles.isAccountGranted,
        generatedPassword: studentProfiles.generatedPassword,
        passwordGeneratedAt: studentProfiles.passwordGeneratedAt,
        assignedTeacherId: studentProfiles.assignedTeacherId,
        assignedTeacherName: teachers.name,
        registeredVia: studentProfiles.registeredVia,
        joinedDate: studentProfiles.joinedDate,
        notes: studentProfiles.notes,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .leftJoin(teachers, eq(studentProfiles.assignedTeacherId, teachers.id))
      .where(condition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(users)
        .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
        .where(condition),
    ]);

    return paginated(items, input.page, input.limit, total);
  }

  async listWaitingStudents(input: CrmListInput) {
    const teachers = alias(users, 'teachers');
    const condition = and(
      eq(users.role, 'STUDENT'),
      or(
        eq(users.status, 'Waiting for Activation'),
        eq(studentProfiles.isAccountGranted, false),
      ),
      input.search ? or(
        ilike(users.name, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
        ilike(users.phone, `%${input.search}%`),
      ) : undefined,
    );

    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        status: users.status,
        createdAt: users.createdAt,
        parentName: studentProfiles.parentName,
        parentEmail: studentProfiles.parentEmail,
        parentPhone: studentProfiles.parentPhone,
        gradeLevel: studentProfiles.gradeLevel,
        cohort: studentProfiles.cohort,
        enrolledCourse: studentProfiles.enrolledCourse,
        schoolName: studentProfiles.schoolName,
        academicYear: studentProfiles.academicYear,
        examBoard: studentProfiles.examBoard,
        examSession: studentProfiles.examSession,
        hardestTopic: studentProfiles.hardestTopic,
        meetingLink: studentProfiles.meetingLink,
        isAccountGranted: studentProfiles.isAccountGranted,
        generatedPassword: studentProfiles.generatedPassword,
        passwordGeneratedAt: studentProfiles.passwordGeneratedAt,
        assignedTeacherId: studentProfiles.assignedTeacherId,
        assignedTeacherName: teachers.name,
        registeredVia: studentProfiles.registeredVia,
        joinedDate: studentProfiles.joinedDate,
        notes: studentProfiles.notes,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .leftJoin(teachers, eq(studentProfiles.assignedTeacherId, teachers.id))
      .where(condition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ total: count() })
        .from(users)
        .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
        .where(condition),
    ]);

    return paginated(items, input.page, input.limit, total);
  }

  async addStudentAccount(adminId: number, data: AddStudentAccountInput) {
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) throw new Error('EMAIL_EXISTS');

    const rawPassword = data.generateCredentials
      ? `Physics@${Math.floor(1000 + Math.random() * 9000)}`
      : 'PhysicsPass123!';
    const hashedPassword = await hashPassword(rawPassword);

    return db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          role: 'STUDENT',
          status: data.status,
        })
        .returning();

      const [newProfile] = await tx
        .insert(studentProfiles)
        .values({
          userId: newUser.id,
          parentName: data.parentName,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          gradeLevel: data.gradeLevel,
          cohort: data.cohort,
          enrolledCourse: data.enrolledCourse,
          assignedTeacherId: data.assignedTeacherId,
          meetingLink: data.meetingLink,
          schoolName: data.schoolName,
          academicYear: data.academicYear,
          examBoard: data.examBoard,
          examSession: data.examSession,
          hardestTopic: data.hardestTopic,
          notes: data.notes,
          registeredVia: 'Direct Admin Entry',
          isAccountGranted: Boolean(data.generateCredentials),
          generatedPassword: data.generateCredentials ? rawPassword : null,
          passwordGeneratedAt: data.generateCredentials ? new Date() : null,
        })
        .returning();

      await tx.insert(auditLogs).values({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'ADD_STUDENT_ACCOUNT',
        details: { studentId: newUser.id, email: newUser.email, name: newUser.name },
      });

      return {
        student: { ...newUser, studentProfile: newProfile },
        credentials: data.generateCredentials
          ? {
              email: newUser.email,
              password: rawPassword,
              generatedAt: new Date().toISOString(),
            }
          : null,
      };
    });
  }

  async assignScholar(studentId: number, adminId: number, data: AssignScholarInput) {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student) throw new Error('USER_NOT_FOUND');

    let [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId)).limit(1);
    if (!profile) {
      [profile] = await db.insert(studentProfiles).values({ userId: studentId }).returning();
    }

    const [updatedProfile] = await db
      .update(studentProfiles)
      .set({
        assignedTeacherId: data.assignedTeacherId !== undefined ? data.assignedTeacherId : profile.assignedTeacherId,
        cohort: data.cohort !== undefined ? data.cohort : profile.cohort,
        enrolledCourse: data.enrolledCourse !== undefined ? data.enrolledCourse : profile.enrolledCourse,
        meetingLink: data.meetingLink !== undefined ? data.meetingLink : profile.meetingLink,
        gradeLevel: data.gradeLevel !== undefined ? data.gradeLevel : profile.gradeLevel,
      })
      .where(eq(studentProfiles.userId, studentId))
      .returning();

    await db.insert(auditLogs).values({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ASSIGN_SCHOLAR',
      details: { studentId, ...data },
    });

    if (data.assignedTeacherId) {
      await db.insert(notifications).values({
        userId: studentId,
        title: 'Academic Assignment Updated',
        message: 'Your assigned instructor and course settings have been updated.',
        type: 'academic',
        linkTab: 'academic',
      });
    }

    return updatedProfile;
  }

  async generateStudentCredentials(studentId: number, adminId: number) {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student) throw new Error('USER_NOT_FOUND');

    const rawPassword = `Quantum#${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await hashPassword(rawPassword);

    await db.transaction(async (tx) => {
      await tx.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, studentId));

      const [existingProfile] = await tx.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId)).limit(1);
      if (existingProfile) {
        await tx
          .update(studentProfiles)
          .set({
            generatedPassword: rawPassword,
            passwordGeneratedAt: new Date(),
            isAccountGranted: true,
          })
          .where(eq(studentProfiles.userId, studentId));
      } else {
        await tx.insert(studentProfiles).values({
          userId: studentId,
          generatedPassword: rawPassword,
          passwordGeneratedAt: new Date(),
          isAccountGranted: true,
        });
      }

      await tx.insert(auditLogs).values({
        actorId: adminId,
        actorRole: 'ADMIN',
        action: 'GENERATE_CREDENTIALS',
        details: { studentId, email: student.email },
      });
    });

    return {
      studentId: student.id,
      name: student.name,
      email: student.email,
      generatedPassword: rawPassword,
      passwordGeneratedAt: new Date().toISOString(),
      isAccountGranted: true,
    };
  }

  async updateStudentStatus(studentId: number, adminId: number, status: string) {
    const [student] = await db.update(users).set({ status, updatedAt: new Date() })
      .where(eq(users.id, studentId))
      .returning();

    if (!student) throw new Error('USER_NOT_FOUND');

    await db.insert(auditLogs).values({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'UPDATE_STUDENT_STATUS',
      details: { studentId, status },
    });

    return student;
  }
}

export const adminService = new AdminService();