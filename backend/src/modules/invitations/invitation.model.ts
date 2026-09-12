import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

const invitationSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['ADMIN', 'MEMBER', 'VIEWER'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: INVITATION_STATUSES, default: 'PENDING', index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

invitationSchema.index({ workspaceId: 1, email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

export type InvitationDocument = InferSchemaType<typeof invitationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Invitation: Model<InvitationDocument> =
  mongoose.models.Invitation ?? mongoose.model<InvitationDocument>('Invitation', invitationSchema);
