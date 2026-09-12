import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const columnSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    position: { type: Number, required: true },
  },
  { _id: false },
);

const boardSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    columns: { type: [columnSchema], default: [] },
  },
  { timestamps: true },
);

boardSchema.index({ projectId: 1 });

export type BoardDocument = InferSchemaType<typeof boardSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Board: Model<BoardDocument> =
  mongoose.models.Board ?? mongoose.model<BoardDocument>('Board', boardSchema);
