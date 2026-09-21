import { db } from '../../db/index.js';
import { users } from '../../db/models/users.js';
import { eq } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import { hashPassword, comparePassword, generateToken } from '../../utils/auth.js';
import { GoogleAuthInput, RegisterInput, LoginInput } from './auth.schema.js';

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

    const [newUser] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: 'STUDENT',
    }).returning();

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

    return user;
  }
}

export const authService = new AuthService();