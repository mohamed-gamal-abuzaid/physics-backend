import { and, count, desc, eq, gt, ne, or, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../../db/index.js';
import { assignments } from '../../db/models/assignments.js';
import { bookingSessions, sessionStudents } from '../../db/models/booking-sessions.js';
import { homeworkSubmissions } from '../../db/models/homework-submissions.js';
import { invoices } from '../../db/models/invoices.js';
import { notifications } from '../../db/models/notifications.js';
import { paymentProofs } from '../../db/models/payment-proofs.js';
import { resources } from '../../db/models/resources.js';
import { reviews } from '../../db/models/reviews.js';
import { tickets, TicketMessage } from '../../db/models/tickets.js';
import { studentProfiles, users } from '../../db/models/users.js';
import {
  AddTicketMessageInput,
  CreatePaymentInput,
  CreateReviewInput,
  CreateSessionInput,
  CreateSubmissionInput,
  CreateTicketInput,
  ListInput,
  ResourceListInput,
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
    if (data.email) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, data.email), ne(users.id, userId)))
        .limit(1);
      if (existingUser) {
        throw new Error('EMAIL_EXISTS');
      }
    }

    const studentPhone = data.studentPhoneNumber ?? data.studentPhone ?? data.phone;
    const parentPhone = data.parentPhoneNumber ?? data.parentPhone;

    // Update users table
    const userUpdates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) userUpdates.name = data.name;
    if (data.email !== undefined) userUpdates.email = data.email;
    if (studentPhone !== undefined) userUpdates.phone = studentPhone;
    if (data.avatar !== undefined) userUpdates.avatar = data.avatar;

    const [updatedUser] = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) throw new Error('STUDENT_NOT_FOUND');

    // Update or insert studentProfiles table
    const profileUpdates: Partial<typeof studentProfiles.$inferInsert> = {};
    if (data.schoolName !== undefined) profileUpdates.schoolName = data.schoolName;
    if (data.year !== undefined) {
      profileUpdates.year = data.year;
      profileUpdates.academicYear = data.year;
    }
    if (data.board !== undefined) {
      profileUpdates.board = data.board;
      profileUpdates.examBoard = data.board;
    }
    if (studentPhone !== undefined) profileUpdates.studentPhone = studentPhone;
    if (parentPhone !== undefined) profileUpdates.parentPhone = parentPhone;
    if (data.parentName !== undefined) profileUpdates.parentName = data.parentName;
    if (data.hardestTopic !== undefined) profileUpdates.hardestTopic = data.hardestTopic;

    const [existingProfile] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      if (Object.keys(profileUpdates).length > 0) {
        await db
          .update(studentProfiles)
          .set(profileUpdates)
          .where(eq(studentProfiles.userId, userId));
      }
    } else {
      await db.insert(studentProfiles).values({
        userId,
        ...profileUpdates,
        registeredVia: 'Profile Update',
      });
    }

    return this.getProfile(userId);
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
      or(
        eq(bookingSessions.studentId, userId),
        sql`EXISTS (SELECT 1 FROM ${sessionStudents} WHERE ${sessionStudents.sessionId} = ${bookingSessions.id} AND ${sessionStudents.studentId} = ${userId})`
      ),
      eq(bookingSessions.isArchived, false),
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(bookingSessions).where(condition).orderBy(desc(bookingSessions.date)).limit(limit).offset(offset),
      db.select({ total: count() }).from(bookingSessions).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getAvailableSlots(userId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active upcoming group sessions
    const upcomingGroups = await db
      .select({
        id: bookingSessions.id,
        courseName: bookingSessions.courseName,
        topic: bookingSessions.topic,
        sessionFormat: bookingSessions.sessionFormat,
        date: bookingSessions.date,
        time: bookingSessions.time,
        durationMinutes: bookingSessions.durationMinutes,
        location: bookingSessions.location,
        maxStudents: bookingSessions.maxStudents,
        meetingLink: bookingSessions.meetingLink,
        notes: bookingSessions.notes,
        teacherId: bookingSessions.teacherId,
      })
      .from(bookingSessions)
      .where(
        and(
          eq(bookingSessions.sessionFormat, 'GROUP'),
          eq(bookingSessions.isArchived, false),
          ne(bookingSessions.status, 'CANCELLED'),
          sql`${bookingSessions.date} >= ${today}`,
        )
      )
      .orderBy(bookingSessions.date);

    const groupList = [];
    for (const group of upcomingGroups) {
      const [countRes] = await db
        .select({ total: count() })
        .from(sessionStudents)
        .where(eq(sessionStudents.sessionId, group.id));
      const enrolledCount = countRes?.total ?? 0;
      const maxLimit = group.maxStudents ?? 10;

      let isEnrolled = false;
      if (userId) {
        const [joined] = await db
          .select()
          .from(sessionStudents)
          .where(and(eq(sessionStudents.sessionId, group.id), eq(sessionStudents.studentId, userId)))
          .limit(1);
        isEnrolled = Boolean(joined);
      }

      const isFull = enrolledCount >= maxLimit;
      groupList.push({
        ...group,
        enrolledCount,
        maxStudents: maxLimit,
        remainingSpots: Math.max(0, maxLimit - enrolledCount),
        isFull,
        isEnrolled,
      });
    }

    // Also get all booked times for instructor to prevent private slot collisions
    const bookedSlots = await db
      .select({
        id: bookingSessions.id,
        date: bookingSessions.date,
        time: bookingSessions.time,
        sessionFormat: bookingSessions.sessionFormat,
      })
      .from(bookingSessions)
      .where(
        and(
          eq(bookingSessions.isArchived, false),
          ne(bookingSessions.status, 'CANCELLED'),
          sql`${bookingSessions.date} >= ${today}`,
        )
      );

    return {
      // Filter out full groups so students can only choose groups with available capacity
      availableGroups: groupList.filter((g) => !g.isFull),
      allGroups: groupList,
      bookedSlots,
    };
  }

  async createSession(userId: number, data: CreateSessionInput) {
    // Case 1: Joining an existing group session
    if (data.existingSessionId) {
      const [existingGroup] = await db
        .select()
        .from(bookingSessions)
        .where(eq(bookingSessions.id, data.existingSessionId))
        .limit(1);

      if (!existingGroup) throw new Error('SESSION_NOT_FOUND');
      if (existingGroup.sessionFormat !== 'GROUP') throw new Error('NOT_A_GROUP_SESSION');

      // Check if student already enrolled
      const [alreadyEnrolled] = await db
        .select()
        .from(sessionStudents)
        .where(and(eq(sessionStudents.sessionId, existingGroup.id), eq(sessionStudents.studentId, userId)))
        .limit(1);
      if (alreadyEnrolled) throw new Error('STUDENT_ALREADY_IN_SESSION');

      // Capacity check: if group reached student limit, block booking
      const [currentEnrolled] = await db
        .select({ total: count() })
        .from(sessionStudents)
        .where(eq(sessionStudents.sessionId, existingGroup.id));
      const maxLimit = existingGroup.maxStudents ?? (existingGroup.sessionNotes as any)?.maxStudents ?? 10;
      if ((currentEnrolled?.total ?? 0) >= maxLimit) {
        throw new Error('GROUP_CAPACITY_REACHED: This group session has reached its maximum student limit.');
      }

      // Deduct 1 group credit
      const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
      const groupCredits = profile?.remainingGroupCredits ?? 0;
      const creditField = groupCredits > 0 ? 'remainingGroupCredits' : 'remainingCredits';
      const availableCredits = groupCredits > 0 ? groupCredits : (profile?.remainingCredits ?? 0);
      if (availableCredits < 1) throw new Error('INSUFFICIENT_CREDITS');

      return db.transaction(async (tx) => {
        const creditCol = studentProfiles[creditField];
        await tx.update(studentProfiles)
          .set({ [creditField]: sql`${creditCol} - 1` })
          .where(and(eq(studentProfiles.userId, userId), gt(creditCol, 0)));

        await tx.insert(sessionStudents).values({
          sessionId: existingGroup.id,
          studentId: userId,
        });

        const [student] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
        const admins = await tx.select({ id: users.id }).from(users).where(and(eq(users.role, 'ADMIN'), eq(users.status, 'ACTIVE')));

        if (admins.length > 0) {
          await tx.insert(notifications).values(
            admins.map((admin) => ({
              userId: admin.id,
              title: 'Student Joined Group Masterclass',
              message: `${student?.name ?? 'A student'} joined "${existingGroup.topic}".`,
              type: 'SESSION',
              linkTab: 'schedule',
              read: false,
            }))
          );
        }

        return existingGroup;
      });
    }

    // Case 2: Booking a private (or new) session
    const sessionDate = data.date ? new Date(data.date) : new Date();
    if (sessionDate <= new Date()) throw new Error('SESSION_DATE_INVALID');

    let teacherId = data.teacherId;
    if (!teacherId) {
      const [defaultAdmin] = await db.select({ id: users.id }).from(users).where(and(eq(users.role, 'ADMIN'), eq(users.status, 'ACTIVE'))).limit(1);
      if (!defaultAdmin) throw new Error('TEACHER_NOT_FOUND');
      teacherId = defaultAdmin.id;
    } else {
      const [teacher] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, teacherId), eq(users.role, 'ADMIN'), eq(users.status, 'ACTIVE'))).limit(1);
      if (!teacher) throw new Error('TEACHER_NOT_FOUND');
    }

    // Time conflict prevention: check if instructor has any active session at this date and time
    if (data.time) {
      const conflict = await db
        .select({
          id: bookingSessions.id,
          topic: bookingSessions.topic,
          sessionFormat: bookingSessions.sessionFormat,
        })
        .from(bookingSessions)
        .where(
          and(
            eq(bookingSessions.teacherId, teacherId),
            eq(bookingSessions.isArchived, false),
            ne(bookingSessions.status, 'CANCELLED'),
            sql`DATE(${bookingSessions.date}) = DATE(${sessionDate})`,
            eq(bookingSessions.time, data.time),
          )
        )
        .limit(1);

      if (conflict.length > 0) {
        throw new Error(`TIME_CONFLICT: The instructor is unavailable at this date and time due to an existing ${conflict[0].sessionFormat} session ("${conflict[0].topic}"). Please choose another slot.`);
      }
    }

    if (data.assignedHomeworkId) {
      await this.getAssignment(userId, data.assignedHomeworkId);
    }

    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
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
        courseName: data.courseName,
        topic: data.topic,
        sessionFormat: data.sessionFormat,
        date: sessionDate,
        time: data.time,
        durationMinutes: data.durationMinutes || 60,
        location: data.location,
        notes: data.notes,
        teacherId,
        studentId: userId,
        status: 'SCHEDULED',
        maxStudents: data.sessionFormat === 'PRIVATE' ? 1 : 10,
      }).returning();

      // Notify all admin users about the new session booking
      const [student] = await transaction
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const admins = await transaction
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'ADMIN'), eq(users.status, 'ACTIVE')));

      if (admins.length > 0) {
        const studentName = student?.name ?? 'A student';
        const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        await transaction.insert(notifications).values(
          admins.map((admin) => ({
            userId: admin.id,
            title: 'New Session Booking',
            message: `${studentName} has booked a ${data.sessionFormat?.toLowerCase() ?? ''} session for ${formattedDate} (${data.time ?? ''}).`,
            type: 'SESSION',
            linkTab: 'schedule',
            read: false,
          }))
        );
      }

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

  async getResources(input: ResourceListInput) {
    const condition = and(
      input.search ? sql`lower(${resources.title}) like ${`%${input.search.toLowerCase()}%`}` : undefined,
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

  async downloadResource(id: number) {
    const [resource] = await db
      .update(resources)
      .set({ downloadCount: sql`coalesce(${resources.downloadCount}, 0) + 1` })
      .where(eq(resources.id, id))
      .returning();
    if (!resource) throw new Error('RESOURCE_NOT_FOUND');
    return resource;
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

  async getInvoices(userId: number, input: ListInput) {
    const condition = and(
      eq(invoices.studentId, userId),
      input.status ? eq(invoices.status, input.status as 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED') : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(invoices).where(condition).orderBy(desc(invoices.issueDate)).limit(limit).offset(offset),
      db.select({ total: count() }).from(invoices).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getInvoice(userId: number, invoiceId: number) {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.studentId, userId)))
      .limit(1);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    return invoice;
  }

  async getTickets(userId: number, input: ListInput) {
    const condition = and(
      eq(tickets.studentId, userId),
      input.status ? eq(tickets.status, input.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') : undefined,
    );
    const { limit, offset } = getPagination(input);
    const [items, [{ total }]] = await Promise.all([
      db.select().from(tickets).where(condition).orderBy(desc(tickets.updatedAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(tickets).where(condition),
    ]);
    return paginated(items, input.page, input.limit, total);
  }

  async getTicket(userId: number, ticketId: number) {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.studentId, userId)))
      .limit(1);
    if (!ticket) throw new Error('TICKET_NOT_FOUND');
    return ticket;
  }

  async createTicket(userId: number, data: CreateTicketInput) {
    const [user] = await db.select({ name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, userId)).limit(1);
    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;
    const initialMessage: TicketMessage = {
      id: randomUUID(),
      sender: user?.name || 'Student',
      role: data.requesterRole,
      text: data.message,
      timestamp: new Date().toISOString(),
      avatar: user?.avatar || undefined,
    };

    const [ticket] = await db
      .insert(tickets)
      .values({
        ticketNumber,
        studentId: userId,
        requesterRole: data.requesterRole,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        status: 'OPEN',
        messages: [initialMessage],
      })
      .returning();

    return ticket;
  }

  async addTicketMessage(userId: number, ticketId: number, data: AddTicketMessageInput) {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.studentId, userId)))
      .limit(1);

    if (!ticket) throw new Error('TICKET_NOT_FOUND');
    if (ticket.status === 'CLOSED') throw new Error('TICKET_CLOSED');

    const [user] = await db.select({ name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, userId)).limit(1);
    const newMessage: TicketMessage = {
      id: randomUUID(),
      sender: user?.name || 'Student',
      role: ticket.requesterRole,
      text: data.text,
      timestamp: new Date().toISOString(),
      avatar: user?.avatar || undefined,
    };

    const updatedMessages = [...(ticket.messages || []), newMessage];
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    return updatedTicket;
  }
}

export const studentService = new StudentService();