import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function uploadToR2(bucket, publicUrl, filePart) {
    if (!ALLOWED_IMAGE_TYPES.includes(filePart.mimetype)) {
        return { error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    const ext = filePart.filename.substring(filePart.filename.lastIndexOf('.'));
    const key = `${randomUUID()}${ext}`;

    let buffer;
    try {
        buffer = await filePart.toBuffer();
    } catch (err) {
        console.error('R2 upload — failed to read file buffer:', err);
        return { error: 'Failed to read uploaded file' };
    }

    try {
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: filePart.mimetype,
        }));
    } catch (err) {
        console.error('R2 upload — S3 PutObject failed:', {
            code: err.Code,
            status: err.$metadata?.httpStatusCode,
            bucket,
            key,
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
            message: err.message,
        });
        return { error: 'Failed to upload image to storage' };
    }

    return { url: `${publicUrl}/${key}` };
}

async function deleteFromR2(bucket, imageUrl) {
    if (!imageUrl) return;

    // Extract the key (filename) from the full URL
    const key = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
    if (!key) return;

    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        }));
    } catch {
        // Ignore delete errors — file may already be gone
    }
}

export async function saveProfileImage(filePart) {
    return uploadToR2(
        process.env.R2_PROFILES_BUCKET,
        process.env.R2_PROFILES_PUBLIC_URL,
        filePart
    );
}

export async function deleteProfileImage(imageUrl) {
    return deleteFromR2(process.env.R2_PROFILES_BUCKET, imageUrl);
}

export async function saveTicketImage(filePart) {
    return uploadToR2(
        process.env.R2_TICKETS_BUCKET,
        process.env.R2_TICKETS_PUBLIC_URL,
        filePart
    );
}

export async function deleteTicketImage(imageUrl) {
    return deleteFromR2(process.env.R2_TICKETS_BUCKET, imageUrl);
}
