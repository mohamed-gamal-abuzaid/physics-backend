import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import studentRoutes from './modules/student/student.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import { authenticate } from './middlewares/auth.middleware.js';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', authenticate, (_req: Request, res: Response) => {
	res.status(200).json({ status: 'OK', message: 'Physics API is running smoothly' });
});

export default app;
