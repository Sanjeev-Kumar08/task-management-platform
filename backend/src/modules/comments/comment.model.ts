import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const commentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

commentSchema.index({ taskId: 1 });
commentSchema.index({ content: 'text' });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment: Model<CommentDocument> =
  mongoose.models.Comment ?? mongoose.model<CommentDocument>('Comment', commentSchema);
