import { Schema, model } from "mongoose";

export interface IUser {
  username: string;
  createdDate: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, maxlength: 500 },
    createdDate: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    toJSON: {
      // Expose Mongo's _id as `id`, matching the shape of your user object.
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

export const User = model<IUser>("User", userSchema);
