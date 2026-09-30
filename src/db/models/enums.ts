import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'STUDENT', 'PARENT']);
export const sessionStatusEnum = pgEnum('session_status', ['SCHEDULED', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW']);
export const sessionFormatEnum = pgEnum('session_format', ['PRIVATE', 'GROUP']);
export const homeworkStatusEnum = pgEnum('homework_status', ['PENDING', 'SUBMITTED', 'GRADED', 'LATE', 'RESUBMIT_REQUESTED']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']);
export const paymentProofStatusEnum = pgEnum('payment_proof_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const ticketStatusEnum = pgEnum('ticket_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const campaignStatusEnum = pgEnum('campaign_status', ['DRAFT', 'SENDING', 'SENT', 'FAILED']);
export const reviewStatusEnum = pgEnum('review_status', ['PENDING', 'APPROVED', 'REJECTED']);