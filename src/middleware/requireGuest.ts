import { NextFunction, Request, Response } from "express";
import { Types, isObjectIdOrHexString } from "mongoose";
import { User } from "../models/Users";

declare global {
  namespace Express {
    interface Request {
      userId: Types.ObjectId;
    }
  }
}

export async function requireGuest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers["x-guest-id"];
  const guestId = (Array.isArray(header) ? header[0] : header)?.trim();

  if (!guestId || !isObjectIdOrHexString(guestId)) {
    return res
      .status(401)
      .json({ error: "Missing or invalid X-Guest-Id header" });
  }

  const exists = await User.exists({ _id: guestId });
  if (!exists) {
    return res.status(401).json({ error: "Guest user not found" });
  }

  req.userId = new Types.ObjectId(guestId);
  next();
}
