import { Schema, Types, model } from "mongoose";

export interface ITask {
  task: string;
  userId: Types.ObjectId;
  createdDate: Date;
  isImportant: boolean;
  isCompleted: boolean;
  isEdited: boolean;
}

const taskSchema = new Schema<ITask>(
  {
    task: { type: String, required: true, trim: true, maxlength: 500 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdDate: { type: Date, default: Date.now },
    isImportant: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

// Every query is filtered by user and sorted by date, so index for that
taskSchema.index({ userId: 1, createdDate: -1 });

export const Task = model<ITask>("Task", taskSchema);
