import { Queue, Worker, type Job, type ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { cleanupExpiredSessions } from '../modules/auth/token.service.js';
import { sendEmail } from '../email/email.service.js';
import { metrics } from '../observability/metrics.js';
import { errorTracker } from '../observability/errorTracker.js';
import type { Server as SocketServer } from 'socket.io';

let ioRef: SocketServer | null = null;
let sharedConnection: Redis | null = null;

export function setSocketServer(io: SocketServer): void {
  ioRef = io;
}

function getConnection(): ConnectionOptions {
  if (!sharedConnection) {
    sharedConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return sharedConnection as unknown as ConnectionOptions;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string | null;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  body?: string;
  template?: string;
}

let notificationQueue: Queue<NotificationJobData> | null = null;
let emailQueue: Queue<EmailJobData> | null = null;
let cleanupQueue: Queue | null = null;

function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = new Queue<NotificationJobData>('notifications', {
      connection: getConnection(),
    });
  }
  return notificationQueue;
}

function getEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue<EmailJobData>('emails', { connection: getConnection() });
  }
  return emailQueue;
}

function getCleanupQueue() {
  if (!cleanupQueue) {
    cleanupQueue = new Queue('cleanup', { connection: getConnection() });
  }
  return cleanupQueue;
}

export async function enqueueNotification(data: NotificationJobData): Promise<void> {
  const payload = {
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    entityType: data.entityType ?? null,
    entityId: data.entityId ?? null,
    actionUrl: data.actionUrl ?? null,
    read: false,
  };

  if (env.isTest) {
    const doc = await Notification.create(payload);
    ioRef?.to(`user:${data.userId}`).emit('notification:new', {
      eventId: String(doc._id),
      notification: doc,
    });
    return;
  }
  await getNotificationQueue().add('notify', data, {
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  const payload: EmailJobData = {
    ...data,
    html: data.html ?? data.body ?? '',
    text: data.text ?? data.body,
  };

  // Console provider: send immediately so local/dev never depends on Redis workers.
  if (env.isTest || env.EMAIL_PROVIDER === 'console' || !env.EMAIL_API_KEY) {
    await sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html || payload.subject,
      text: payload.text,
    });
    return;
  }

  await getEmailQueue().add('send', payload, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export function startWorkers(): void {
  if (env.isTest) return;

  const notificationWorker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const doc = await Notification.create({
        userId: job.data.userId,
        type: job.data.type,
        title: job.data.title,
        message: job.data.message,
        entityType: job.data.entityType ?? null,
        entityId: job.data.entityId ?? null,
        actionUrl: job.data.actionUrl ?? null,
        read: false,
      });

      ioRef?.to(`user:${job.data.userId}`).emit('notification:new', {
        eventId: String(doc._id),
        notification: doc,
      });

      logger.info({ jobId: job.id, userId: job.data.userId }, 'Notification job processed');
    },
    { connection: getConnection() },
  );

  const emailWorker = new Worker<EmailJobData>(
    'emails',
    async (job: Job<EmailJobData>) => {
      await sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html || job.data.body || job.data.subject,
        text: job.data.text || job.data.body,
      });
      metrics.incr('email.jobs.success');
      logger.info(
        { jobId: job.id, to: job.data.to, template: job.data.template },
        'Email job processed',
      );
    },
    { connection: getConnection() },
  );

  const cleanupWorker = new Worker(
    'cleanup',
    async () => {
      const cleaned = await cleanupExpiredSessions();
      logger.info({ cleaned }, 'Cleanup job processed');
    },
    { connection: getConnection() },
  );

  notificationWorker.on('failed', (job, err) => {
    metrics.incr('notification.jobs.failed');
    errorTracker.captureException(err, { jobId: job?.id, queue: 'notifications' });
    logger.error({ err, jobId: job?.id }, 'Notification job failed');
  });
  emailWorker.on('failed', (job, err) => {
    metrics.incr('email.jobs.failed');
    errorTracker.captureException(err, { jobId: job?.id, queue: 'emails' });
    logger.error({ err, jobId: job?.id }, 'Email job failed');
  });
  cleanupWorker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Cleanup job failed');
  });

  void getCleanupQueue().add(
    'expired-sessions',
    {},
    {
      repeat: { every: 60 * 60 * 1000 },
      removeOnComplete: true,
    },
  );

  logger.info('BullMQ workers started');
}
