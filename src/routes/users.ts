import { Router, Request, Response } from "express";
import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";
import { User } from "../models/Users";

const router = Router();

const createSchema = z.object({
  username: z.string().trim().min(1, "user cannot be empty").max(500),
});

// POST "/"
// @desc Create a user
router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema?.safeParse(req?.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: z.flattenError(parsed?.error),
    });
  }

  const user = await User.create(parsed?.data);
  res.status(201).json(user);
});

const adjectives = [
  "swift",
  "calm",
  "brave",
  "clever",
  "happy",
  "lucky",
  "quiet",
  "bright",
];
const animals = [
  "otter",
  "falcon",
  "panda",
  "fox",
  "koala",
  "lynx",
  "heron",
  "gecko",
];

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

// e.g. "swift-otter-4821"
const generateGuestUsername = () =>
  `${pick(adjectives)}-${pick(animals)}-${Math.floor(1000 + Math.random() * 9000)}`;

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === 11000;

// POST "/guest"
// @desc Return the existing guest user matching the x-guest-username header,
//       or create a new guest user with a unique generated username
router.post("/guest", async (req: Request, res: Response) => {
  const header = req.headers["x-guest-id"];
  const guestId = (Array.isArray(header) ? header[0] : header)?.trim();

  // Reuse the existing guest if the id is valid and still in the database
  if (guestId && isObjectIdOrHexString(guestId)) {
    const existingUser = await User.findById(guestId);
    if (existingUser) return res.status(200).json(existingUser);
  }

  await User.init();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const user = await User.create({ username: generateGuestUsername() });
      return res.status(201).json(user);
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
  }

  res
    .status(503)
    .json({ error: "Could not generate a unique username, please retry" });
});

// GET "/:id"
// @desc Check that a stored guest user still exists
router.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!isObjectIdOrHexString(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
