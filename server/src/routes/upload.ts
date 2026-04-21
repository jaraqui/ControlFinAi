import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const userId = req.user?.id || 'uploads';
    const dir = path.join(process.cwd(), 'uploads', userId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use PDF, JPEG, PNG, GIF ou WebP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post('/',
  isAuthenticated,
  upload.single('attachment'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

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
          attachment: `/uploads/${userId}/${req.file.filename}`,
          attachmentName: req.file.originalname,
          attachmentType: req.file.mimetype,
        },
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
);

router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req.user as any).id;
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id, userId },
    });

    if (!transaction || !transaction.attachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(process.cwd(), transaction.attachment);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, transaction.attachmentName);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
  }
);

export default router;
}