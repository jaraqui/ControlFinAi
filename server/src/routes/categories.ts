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
    const { type } = req.query;

    const where: any = { userId };
    if (type) where.type = type as string;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { name, type, color } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        type: type || 'expense',
        color: color || '#6366f1',
        userId,
      },
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { id } = req.params;
    const { name, type, color } = req.body;

    const category = await prisma.category.update({
      where: { id, userId },
      data: {
        name,
        type,
        color,
      },
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { id } = req.params;

    await prisma.category.delete({
      where: { id, userId },
    });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;