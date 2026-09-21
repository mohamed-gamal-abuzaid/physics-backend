import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { googleAuthSchema, registerSchema, loginSchema } from './auth.schema.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';

export const register = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const result = await authService.register(validation.data);
    return res.status(201).json({
      message: 'Account registered successfully',
      ...result,
    });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    console.error('REGISTER ERROR:', error);
    return res.status(500).json({ message: 'An error occurred while registering' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const result = await authService.login(validation.data);
    return res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.status(500).json({ message: 'An error occurred while logging in', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await authService.getProfile(req.user.id);
    return res.json({ user });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(500).json({ message: 'An error occurred while fetching user data', error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const validation = googleAuthSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const result = await authService.googleLogin(validation.data);
    return res.json({
      message: 'Google login successful',
      ...result,
    });
  } catch (error: any) {
    if (error.message === 'GOOGLE_CLIENT_ID_MISSING') {
      return res.status(500).json({ message: 'Google login is not configured' });
    }
    if (error.message === 'INVALID_GOOGLE_TOKEN') {
      return res.status(401).json({ message: 'Invalid Google ID token' });
    }
    return res.status(500).json({ message: 'An error occurred while logging in with Google' });
  }
};