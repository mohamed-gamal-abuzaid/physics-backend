import { pgTable, serial, text, timestamp, integer, varchar, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }).notNull(),
  actorRole: varchar('actor_role', { length: 50 }),
  action: text('action').notNull(),
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});