import { Request, Response } from 'express';
import { publicService } from './public.service.js';
import { bookSessionInquirySchema, trialRegistrationSchema } from './public.schema.js';

export const getConfig = async (_req: Request, res: Response) => {
  try {
    const config = await publicService.getConfig();
    return res.json({ config });
  } catch {
    return res.status(500).json({ message: 'Failed to load configuration' });
  }
};

export const getHallOfFame = async (_req: Request, res: Response) => {
  try {
    const hallOfFame = await publicService.getHallOfFame();
    return res.json({ hallOfFame });
  } catch {
    return res.status(500).json({ message: 'Failed to load hall of fame' });
  }
};

export const getReviews = async (_req: Request, res: Response) => {
  try {
    const reviews = await publicService.getReviews();
    return res.json({ reviews });
  } catch {
    return res.status(500).json({ message: 'Failed to load reviews' });
  }
};

export const getPaymentChannels = async (_req: Request, res: Response) => {
  try {
    const channels = await publicService.getPaymentChannels();
    return res.json({ channels });
  } catch {
    return res.status(500).json({ message: 'Failed to load payment channels' });
  }
};

export const registerTrial = async (req: Request, res: Response) => {
  const validation = trialRegistrationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.format() });
  }

  try {
    const result = await publicService.registerTrial(validation.data);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }
    return res.status(500).json({ message: 'Failed to register free trial' });
  }
};

export const bookSessionInquiry = async (req: Request, res: Response) => {
  const validation = bookSessionInquirySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.format() });
  }

  try {
    const result = await publicService.bookSessionInquiry(validation.data);
    return res.status(201).json(result);
  } catch {
    return res.status(500).json({ message: 'Failed to submit booking inquiry' });
  }
};
