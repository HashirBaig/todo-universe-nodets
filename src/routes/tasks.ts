import { Router, Request, Response } from "express";
import { isObjectIdOrHexString, Types } from "mongoose";
import { z } from "zod";
import { Task } from "../models/Tasks";
import { requireGuest } from "../middleware/requireGuest";

const router = Router();

// Every task route requires a valid guest user
router.use(requireGuest);

const createSchema = z.object({
  task: z.string().trim().min(1, "task cannot be empty").max(500),
  isImportant: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
});

const updateSchema = createSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update",
  });

const boolParam = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const listQuerySchema = z.object({
  task_type: z.enum(["all", "active", "completed"]).default("all"),
  isImportant: boolParam,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(2),
});

type TYPE_GET_TASK_FILTER = {
  userId: Types.ObjectId;
  isCompleted?: boolean;
  isImportant?: boolean;
};

const validId = (req: Request, res: Response): string | null => {
  const id = String(req.params.id);
  if (!isObjectIdOrHexString(id)) {
    res.status(400).json({ error: "Invalid task id" });
    return null;
  }
  return id;
};

// POST "/"
// @desc Create a task for the current guest
router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: z.flattenError(parsed.error),
    });
  }

  const task = await Task.create({ ...parsed.data, userId: req.userId });
  res.status(201).json(task);
});

// GET "/"
// @desc List the current guest's tasks
router.get("/", async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: z.flattenError(parsed.error),
    });
  }

  const { task_type, isImportant, page, limit } = parsed.data;

  const filter: TYPE_GET_TASK_FILTER = { userId: req.userId };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdDate: -1, _id: -1 }) // _id keeps the order stable when dates tie
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

// GET "/:id"
// @desc Get one of the current guest's tasks
router.get("/:id", async (req: Request, res: Response) => {
  const id = validId(req, res);
  if (!id) return;

  const task = await Task.findOne({ _id: id, userId: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// PATCH/PUT "/:id"
// @desc Update one of the current guest's tasks
const updateHandler = async (req: Request, res: Response) => {
  const id = validId(req, res);
  if (!id) return;

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: z.flattenError(parsed.error),
    });
  }

  const task = await Task.findOne({ _id: id, userId: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found" });

  // Flag as edited only when the task text actually changes
  if (parsed.data.task !== undefined && parsed.data.task !== task.task) {
    task.isEdited = true;
  }

  task.set(parsed.data);
  await task.save();

  res.json(task);
};
router.patch("/:id", updateHandler);
router.put("/:id", updateHandler);

// DELETE "/:id"
// @desc Delete one of the current guest's tasks
router.delete("/:id", async (req: Request, res: Response) => {
  const id = validId(req, res);
  if (!id) return;

  const task = await Task.findOneAndDelete({ _id: id, userId: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(204).send();
});

export default router;
