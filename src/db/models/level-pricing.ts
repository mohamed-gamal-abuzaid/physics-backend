import { pgTable, serial, text, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { sessionFormatEnum } from './enums.js';

export const levelSessionPricing = pgTable('level_session_pricing', {
  id: serial('id').primaryKey(),
  levelName: text('level_name').notNull(),
  stageCode: text('stage_code'),
  sessionFormat: sessionFormatEnum('session_format').default('PRIVATE').notNull(),
  sessionsCount: integer('sessions_count').default(1).notNull(),
  title: text('title').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('EGP').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type LevelSessionPricing = typeof levelSessionPricing.$inferSelect;
export type NewLevelSessionPricing = typeof levelSessionPricing.$inferInsert;
