import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';

import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import uploadRoutes from './routes/upload';
import './services/passport';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    }
  }
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: [process.env.CLIENT_URL || ''],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  (req as any).prisma = prisma;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});