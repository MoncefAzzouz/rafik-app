import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Cloudflare R2 (S3-compatible) storage for uploaded images.
// Configure via env: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
// When those aren't set (e.g. local dev), files fall back to the local uploads/ folder.

const UPLOADS_BASE = path.join(__dirname, '../../uploads');

// Read env lazily (dotenv.config() may run after this module is imported)
function cfg() {
  return {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

export function isR2Enabled(): boolean {
  const c = cfg();
  return !!(c.endpoint && c.accessKeyId && c.secretAccessKey && c.bucket && c.publicUrl);
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    const c = cfg();
    _client = new S3Client({
      region: 'auto',
      endpoint: c.endpoint,
      credentials: {
        accessKeyId: c.accessKeyId as string,
        secretAccessKey: c.secretAccessKey as string,
      },
    });
  }
  return _client;
}

function makeKey(folder: string, originalName: string): string {
  const ext = (path.extname(originalName || '') || '').toLowerCase();
  return `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

// Store an in-memory multer file. Returns the URL to save in the DB:
//   R2 enabled  -> full public URL  (https://pub-xxxx.r2.dev/folder/file.jpg)
//   R2 disabled -> local path       (/uploads/folder/file.jpg)
export async function storeUpload(file: Express.Multer.File, folder: string): Promise<string> {
  const key = makeKey(folder, file.originalname);

  if (isR2Enabled()) {
    const c = cfg();
    await client().send(new PutObjectCommand({
      Bucket: c.bucket as string,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    return `${(c.publicUrl as string).replace(/\/+$/, '')}/${key}`;
  }

  // Local-disk fallback (dev)
  const dir = path.join(UPLOADS_BASE, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_BASE, key), file.buffer);
  return `/uploads/${key}`;
}

// Best-effort delete of a previously stored image (accepts the stored URL/path).
export async function deleteUpload(storedUrl: string | null | undefined): Promise<void> {
  if (!storedUrl) return;
  const c = cfg();
  try {
    if (isR2Enabled() && c.publicUrl && storedUrl.startsWith(c.publicUrl.replace(/\/+$/, ''))) {
      const key = storedUrl.slice(c.publicUrl.replace(/\/+$/, '').length + 1);
      await client().send(new DeleteObjectCommand({ Bucket: c.bucket as string, Key: key }));
    } else if (storedUrl.startsWith('/uploads/')) {
      const full = path.join(UPLOADS_BASE, storedUrl.replace(/^\/uploads\//, ''));
      if (full.startsWith(UPLOADS_BASE) && fs.existsSync(full)) fs.unlinkSync(full);
    }
  } catch (err) {
    console.error('[r2] delete failed (ignored):', err);
  }
}

// Shared multer config: keep files in memory (so we can push the buffer to R2),
// images only, no size limit.
export const IMAGE_MIME = /image\/(jpeg|png|gif|webp)/;

export function memoryUpload() {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => cb(null, IMAGE_MIME.test(file.mimetype)),
  });
}
