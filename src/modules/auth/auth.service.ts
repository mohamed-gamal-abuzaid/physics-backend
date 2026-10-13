import { db } from '../../db/index.js';
import { users, studentProfiles } from '../../db/models/users.js';
import { eq, and, ne } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import { hashPassword, comparePassword, generateToken } from '../../utils/auth.js';
import { GoogleAuthInput, RegisterInput, LoginInput, UpdateUserInput } from './auth.schema.js';

export class AuthService {
  private createAuthResponse(user: typeof users.$inferSelect) {
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(data: RegisterInput) {
    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('EMAIL_EXISTS');
    }

    const hashedPassword = await hashPassword(data.password);
    const studentPhone = data.studentPhoneNumber || data.studentPhone || data.phone || null;
    const parentPhone = data.parentPhoneNumber || data.parentPhone || null;

    const [newUser] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: studentPhone,
      role: 'STUDENT',
    }).returning();

    await db.insert(studentProfiles).values({
      userId: newUser.id,
      schoolName: data.schoolName,
      year: data.year,
      board: data.board,
      academicYear: data.year,
      examBoard: data.board,
      studentPhone: studentPhone,
      parentPhone: parentPhone,
      registeredVia: 'Direct Registration',
    });

    return this.createAuthResponse(newUser);
  }

  async login(data: LoginInput) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isPasswordValid = user.password
      ? await comparePassword(data.password, user.password)
      : false;
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    return this.createAuthResponse(user);
  }

  async googleLogin(data: GoogleAuthInput) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID_MISSING');
    }

    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: data.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new Error('INVALID_GOOGLE_TOKEN');
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error('INVALID_GOOGLE_TOKEN');
    }

    const [googleUser] = await db.select().from(users).where(eq(users.googleId, payload.sub)).limit(1);
    if (googleUser) {
      return this.createAuthResponse(googleUser);
    }

    const [emailUser] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);
    if (emailUser) {
      const [linkedUser] = await db.update(users)
        .set({ googleId: payload.sub, name: payload.name || emailUser.name })
        .where(eq(users.id, emailUser.id))
        .returning();
      return this.createAuthResponse(linkedUser);
    }

    const [newUser] = await db.insert(users).values({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      googleId: payload.sub,
      password: await hashPassword(randomBytes(32).toString('hex')),
      role: 'STUDENT',
    }).returning();

    return this.createAuthResponse(newUser);
  }

  async getProfile(userId: number) {
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      avatar: users.avatar,
      specialty: users.specialty,
      status: users.status,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    return {
      ...user,
      studentProfile: profile || null,
      schoolName: profile?.schoolName || null,
      year: profile?.year || profile?.academicYear || null,
      board: profile?.board || profile?.examBoard || null,
      studentPhone: profile?.studentPhone || user.phone || null,
      studentPhoneNumber: profile?.studentPhone || user.phone || null,
      parentName: profile?.parentName || null,
      parentPhone: profile?.parentPhone || null,
      parentPhoneNumber: profile?.parentPhone || null,
    };
  }

  async updateProfile(userId: number, data: UpdateUserInput) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Email uniqueness check
    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, data.email.toLowerCase()), ne(users.id, userId)))
        .limit(1);
      if (existing) {
        throw new Error('EMAIL_EXISTS');
      }
    }

    // Password change check
    let newHashedPassword: string | undefined;
    if (data.newPassword) {
      if (user.password) {
        if (!data.currentPassword) {
          throw new Error('CURRENT_PASSWORD_REQUIRED');
        }
        const matches = await comparePassword(data.currentPassword, user.password);
        if (!matches) {
          throw new Error('INVALID_CURRENT_PASSWORD');
        }
      }
      newHashedPassword = await hashPassword(data.newPassword);
    }

    const studentPhone = data.studentPhoneNumber ?? data.studentPhone ?? data.phone;
    const parentPhone = data.parentPhoneNumber ?? data.parentPhone;

    // Update users table
    const userUpdates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined && data.name.trim()) userUpdates.name = data.name.trim();
    if (data.email !== undefined && data.email.trim()) userUpdates.email = data.email.trim().toLowerCase();
    if (studentPhone !== undefined) userUpdates.phone = studentPhone;
    if (data.avatar !== undefined) userUpdates.avatar = data.avatar;
    if (newHashedPassword) userUpdates.password = newHashedPassword;

    await db.update(users).set(userUpdates).where(eq(users.id, userId));

    // Update studentProfiles table (if student or if student fields provided)
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

    const [existingProfile] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      if (Object.keys(profileUpdates).length > 0) {
        await db.update(studentProfiles).set(profileUpdates).where(eq(studentProfiles.userId, userId));
      }
    } else if (user.role === 'STUDENT' || Object.keys(profileUpdates).length > 0) {
      await db.insert(studentProfiles).values({
        userId,
        ...profileUpdates,
        registeredVia: 'Profile Update',
      });
    }

    return this.getProfile(userId);
  }
}

export const authService = new AuthService();