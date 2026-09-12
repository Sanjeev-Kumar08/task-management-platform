import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const billingCustomerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    stripeCustomerId: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true },
  },
  { timestamps: true },
);

export type BillingCustomerDocument = InferSchemaType<typeof billingCustomerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BillingCustomer: Model<BillingCustomerDocument> =
  mongoose.models.BillingCustomer ??
  mongoose.model<BillingCustomerDocument>('BillingCustomer', billingCustomerSchema);
