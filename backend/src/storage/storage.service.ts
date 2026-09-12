import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { generateSecureToken } from '../utils/tokens.js';

export interface StoredObjectMeta {
  key: string;
  bucket: string | null;
  provider: 'local' | 's3';
  mimeType: string;
  size: number;
  originalName: string;
}

export interface StorageService {
  createUploadTarget(input: {
    mimeType: string;
    originalName: string;
    size: number;
    workspaceId: string;
  }): Promise<{ uploadUrl: string; method: 'PUT' | 'POST'; key: string; headers?: Record<string, string> }>;
  createDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  saveLocalBuffer(key: string, buffer: Buffer): Promise<void>;
  deleteObject(key: string): Promise<void>;
  resolveAbsolutePath(key: string): string | null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function buildKey(workspaceId: string, originalName: string): string {
  return `workspaces/${workspaceId}/${Date.now()}-${generateSecureToken(8)}-${sanitizeFilename(originalName)}`;
}

class LocalStorageService implements StorageService {
  private root: string;

  constructor() {
    this.root = path.resolve(process.cwd(), env.UPLOAD_DIR);
    if (!existsSync(this.root)) mkdirSync(this.root, { recursive: true });
  }

  resolveAbsolutePath(key: string): string {
    return path.join(this.root, key);
  }

  async createUploadTarget(input: {
    mimeType: string;
    originalName: string;
    size: number;
    workspaceId: string;
  }) {
    const key = buildKey(input.workspaceId, input.originalName);
    const uploadUrl = `${env.APP_URL}/api/storage/upload?key=${encodeURIComponent(key)}`;
    return { uploadUrl, method: 'PUT' as const, key, headers: { 'Content-Type': input.mimeType } };
  }

  async createDownloadUrl(key: string): Promise<string> {
    return `${env.APP_URL}/api/storage/download?key=${encodeURIComponent(key)}`;
  }

  async saveLocalBuffer(key: string, buffer: Buffer): Promise<void> {
    const full = this.resolveAbsolutePath(key);
    mkdirSync(path.dirname(full), { recursive: true });
    await pipeline(Readable.from(buffer), createWriteStream(full));
  }

  async deleteObject(key: string): Promise<void> {
    const full = this.resolveAbsolutePath(key);
    if (existsSync(full)) unlinkSync(full);
  }
}

class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  resolveAbsolutePath(): null {
    return null;
  }

  async createUploadTarget(input: {
    mimeType: string;
    originalName: string;
    size: number;
    workspaceId: string;
  }) {
    const key = buildKey(input.workspaceId, input.originalName);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });
    return { uploadUrl, method: 'PUT' as const, key };
  }

  async createDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async saveLocalBuffer(): Promise<void> {
    throw new Error('S3 provider does not support local buffer uploads; use signed URL');
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export function createStorageService(): StorageService {
  if (env.STORAGE_PROVIDER === 's3' && env.S3_BUCKET && env.S3_ACCESS_KEY_ID) {
    return new S3StorageService();
  }
  return new LocalStorageService();
}

export const storageService = createStorageService();

export { createReadStream };
