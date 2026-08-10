import { Router, Request, Response } from 'express';
import path from 'path';
import { authenticateToken } from '../middlewares/auth';
import { memoryUpload, storeUpload } from '../lib/r2';

const router = Router();

const ALLOWED_TYPES = ['categories', 'bookings', 'professionals', 'profiles', 'chat'];

function resolveType(req: Request): string {
  const type = req.query.type as string;
  return ALLOWED_TYPES.includes(type) ? type : 'profiles';
}

const upload = memoryUpload();

// POST upload file -> R2 (or local disk fallback)
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  if (type && !ALLOWED_TYPES.includes(type)) {
    res.status(400).json({ error: `Invalid upload type. Allowed: ${ALLOWED_TYPES.join(', ')}` });
    return;
  }
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: `Upload failed: ${err.message || 'unknown error'}` });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No image file received (the file must be an image).' });
      return;
    }
    try {
      const url = await storeUpload(req.file, resolveType(req));
      res.json({ url });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

export default router;
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');
