import 'dotenv/config';
import { db } from './index.js';
import { users, studentProfiles } from './models/users.js';
import { hashPassword } from '../utils/auth.js';

const seed = async () => {
  const adminPassword = await hashPassword(process.env.SEED_ADMIN_PASSWORD || 'change-me-admin');
  const studentPassword = await hashPassword(process.env.SEED_STUDENT_PASSWORD || 'change-me-student');

  const [admin] = await db.insert(users).values({
    name: 'Platform Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    password: adminPassword,
    role: 'ADMIN',
  }).onConflictDoUpdate({
    target: users.email,
    set: { role: 'ADMIN', updatedAt: new Date() },
  }).returning();

  const [student] = await db.insert(users).values({
    name: 'Demo Student',
    email: process.env.SEED_STUDENT_EMAIL || 'student@example.com',
    password: studentPassword,
    role: 'STUDENT',
  }).onConflictDoNothing().returning();

  if (student) {
    await db.insert(studentProfiles).values({ userId: student.id }).onConflictDoNothing();
  }

  console.log(`Seed complete. Admin: ${admin.email}`);
  if (student) console.log(`Created student: ${student.email}`);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});