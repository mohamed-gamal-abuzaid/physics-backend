import { pgTable, serial, text, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { campaignStatusEnum } from './enums.js';

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  targetAudience: text('target_audience'),
  sentAt: timestamp('sent_at'),
  recipientCount: integer('recipient_count').default(0),
  openRate: decimal('open_rate', { precision: 5, scale: 2 }).default('0.00'),
  clickRate: decimal('click_rate', { precision: 5, scale: 2 }).default('0.00'),
  status: campaignStatusEnum('status').default('DRAFT').notNull(),
  previewSnippet: text('preview_snippet'),
});