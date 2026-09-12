import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const messageSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

messageSchema.index({ channelId: 1, createdAt: -1 });

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Message: Model<MessageDocument> =
  mongoose.models.Message ?? mongoose.model<MessageDocument>('Message', messageSchema);
