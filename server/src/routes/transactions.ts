import express from 'express';

const router = express.Router();

const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

router.use(isAuthenticated);

router.get('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { startDate, endDate, type, category } = req.query;

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (type) where.type = type;
    if (category) where.category = category;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { type, amount, category, description, date } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date || Date.now()),
        userId,
      },
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id, userId },
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date || Date.now()),
      },
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { id } = req.params;

    await prisma.transaction.delete({
      where: { id, userId },
    });

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      total: income - expenses,
      income,
      expenses,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;