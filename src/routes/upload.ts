import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

const ALLOWED_TYPES = ['categories', 'bookings', 'professionals', 'profiles', 'chat'];
const IMAGE_TYPES = /image\/(jpeg|png|gif|webp)/;

function resolveType(req: Request): string {
  const type = req.query.type as string;
  return ALLOWED_TYPES.includes(type) ? type : 'profiles';
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const targetDir = path.join(__dirname, '../../uploads', resolveType(req));
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, IMAGE_TYPES.test(file.mimetype)),
});

// POST upload file
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  if (type && !ALLOWED_TYPES.includes(type)) {
    res.status(400).json({ error: `Invalid upload type. Allowed: ${ALLOWED_TYPES.join(', ')}` });
    return;
  }
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: 'Upload failed (images only, max 5MB)' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded (images only, max 5MB)' });
      return;
    }
    const url = `/uploads/${resolveType(req)}/${req.file.filename}`;
    res.json({ url });
  });
});

export default router;
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');
