import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  curriculaOptions: jsonb('curricula_options'),
  examSessionOptions: jsonb('exam_session_options'),
  introVideoUrl: text('intro_video_url'),
  sessionPricing: jsonb('session_pricing'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});