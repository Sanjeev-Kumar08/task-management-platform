import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const authTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['PASSWORD_RESET'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

authTokenSchema.index({ userId: 1, type: 1 });

export type AuthTokenDocument = InferSchemaType<typeof authTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuthToken: Model<AuthTokenDocument> =
  mongoose.models.AuthToken ?? mongoose.model<AuthTokenDocument>('AuthToken', authTokenSchema);
