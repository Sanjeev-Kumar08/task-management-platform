import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const subscriptionSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: String, enum: ['free', 'pro', 'business'], required: true, default: 'free' },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid'],
      default: 'active',
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null, index: true },
    stripePriceId: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true },
);

subscriptionSchema.index({ ownerId: 1, status: 1 });

export type SubscriptionDocument = InferSchemaType<typeof subscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Subscription: Model<SubscriptionDocument> =
  mongoose.models.Subscription ??
  mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema);
