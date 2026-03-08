import { pipeline } from 'node:stream/promises';
import { createWriteStream, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function saveProfileImage(filePart) {
    if (!ALLOWED_IMAGE_TYPES.includes(filePart.mimetype)) {
        return { error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    const ext = filePart.filename.substring(filePart.filename.lastIndexOf('.'));
    const filename = `${randomUUID()}${ext}`;
    const destPath = join(process.cwd(), 'uploads', 'profiles', filename);

    await pipeline(filePart.file, createWriteStream(destPath));
    return { path: `uploads/profiles/${filename}` };
}

export function deleteOldImage(imagePath) {
    if (!imagePath) return;
    const fullPath = join(process.cwd(), imagePath);
    if (existsSync(fullPath)) unlinkSync(fullPath);
}