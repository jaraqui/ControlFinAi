import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/api/auth/failure',
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL || 'https://controlfinai.ngsdeveloper.site');
  }
);

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

router.post('/login', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email,
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

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.put('/password', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.password) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });
});

export default router;