import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category'),
  course: text('course'),
  topic: text('topic'),
  fileFormat: varchar('file_format', { length: 20 }),
  fileSize: text('file_size'),
  downloadCount: integer('download_count').default(0),
  author: text('author'),
  uploadDate: timestamp('upload_date').defaultNow().notNull(),
  description: text('description'),
  previewUrl: text('preview_url'),
  fileUrl: text('file_url'),
  badge: text('badge'),
});