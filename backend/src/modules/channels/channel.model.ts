import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { CHANNEL_TYPES } from '../../types/index.js';

const readStateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastReadAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const channelSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: CHANNEL_TYPES, default: 'PUBLIC' },
    archived: { type: Boolean, default: false },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readState: { type: [readStateSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

channelSchema.index({ workspaceId: 1, name: 1 });

export type ChannelDocument = InferSchemaType<typeof channelSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Channel: Model<ChannelDocument> =
  mongoose.models.Channel ?? mongoose.model<ChannelDocument>('Channel', channelSchema);
