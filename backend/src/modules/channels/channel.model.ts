import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { CHANNEL_TYPES } from '../../types/index.js';

const channelSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: CHANNEL_TYPES, default: 'PUBLIC' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

channelSchema.index({ workspaceId: 1 });

export type ChannelDocument = InferSchemaType<typeof channelSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Channel: Model<ChannelDocument> =
  mongoose.models.Channel ?? mongoose.model<ChannelDocument>('Channel', channelSchema);
