import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { WORKSPACE_ROLES } from '../../types/index.js';

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: WORKSPACE_ROLES, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    avatar: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true },
);

workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ slug: 1 }, { unique: true });
workspaceSchema.index({ 'members.userId': 1 });

export type WorkspaceDocument = InferSchemaType<typeof workspaceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Workspace: Model<WorkspaceDocument> =
  mongoose.models.Workspace ?? mongoose.model<WorkspaceDocument>('Workspace', workspaceSchema);
