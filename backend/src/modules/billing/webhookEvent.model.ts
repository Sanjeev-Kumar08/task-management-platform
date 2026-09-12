import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const webhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type WebhookEventDocument = InferSchemaType<typeof webhookEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WebhookEvent: Model<WebhookEventDocument> =
  mongoose.models.WebhookEvent ??
  mongoose.model<WebhookEventDocument>('WebhookEvent', webhookEventSchema);
