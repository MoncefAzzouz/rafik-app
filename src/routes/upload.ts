import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.query.type as string; // 'categories' | 'bookings' | 'professionals' | 'profiles'
    const targetDir = path.join(__dirname, '../../uploads', type || 'profiles');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({ storage });

// POST upload file
router.post('/', authenticateToken, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const type = req.query.type as string || 'profiles';
  const url = `/uploads/${type}/${req.file.filename}`;
  res.json({ url });
});

export default router;
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');
