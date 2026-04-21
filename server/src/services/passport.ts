import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: `${process.env.CLIENT_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0].value || '',
              name: profile.displayName,
              picture: profile.photos?.[0].value,
            },
          });

          await prisma.category.createMany({
            data: [
              { name: 'Salário', type: 'income', color: '#22c55e', userId: user.id },
              { name: 'Freelance', type: 'income', color: '#10b981', userId: user.id },
              { name: 'Investimentos', type: 'income', color: '#14b8a6', userId: user.id },
              { name: 'Alimentação', type: 'expense', color: '#ef4444', userId: user.id },
              { name: 'Transporte', type: 'expense', color: '#f97316', userId: user.id },
              { name: 'Lazer', type: 'expense', color: '#eab308', userId: user.id },
              { name: 'Contas', type: 'expense', color: '#3b82f6', userId: user.id },
              { name: 'Saúde', type: 'expense', color: '#ec4899', userId: user.id },
              { name: 'Educação', type: 'expense', color: '#8b5cf6', userId: user.id },
              { name: 'Outros', type: 'expense', color: '#6b7280', userId: user.id },
            ],
          });
        } else {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: profile.displayName,
              picture: profile.photos?.[0].value,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as any, null);
      }
    }
  )
);

export default passport;