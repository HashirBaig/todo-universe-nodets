import { Schema, model } from "mongoose";

export interface ITask {
  task: string;
  createdDate: Date;
  isImportant: boolean;
  isCompleted: boolean;
  isEdited: boolean;
}

const taskSchema = new Schema<ITask>(
  {
    task: { type: String, required: true, trim: true, maxlength: 500 },
    createdDate: { type: Date, default: Date.now },
    isImportant: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    toJSON: {
      // Expose Mongo's _id as `id`, matching the shape of your task object.
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

export const Task = model<ITask>("Task", taskSchema);
