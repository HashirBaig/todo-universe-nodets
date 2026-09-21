import { Router, Request, Response } from "express";
import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";
import { Task } from "../models/Tasks";

const router = Router();

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
  isCompleted: boolParam,
  isImportant: boolParam,
});

type TYPE_GET_TASK_FILTER = {
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
// @desc Create a task
router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema?.safeParse(req?.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: z.flattenError(parsed?.error),
    });
  }

  const task = await Task.create(parsed?.data);
  res.status(201).json(task);
});

// GET "/"
// @desc List all tasks
router.get("/", async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req?.query);

  if (!parsed?.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: z.flattenError(parsed.error),
    });
  }

  const { task_type, isImportant } = parsed?.data;

  const filter: TYPE_GET_TASK_FILTER = {};

  if (task_type === "active") filter.isCompleted = false;
  if (task_type === "completed") filter.isCompleted = true;
  if (isImportant) filter.isImportant = isImportant;

  const tasks = await Task.find(filter).sort({ createdDate: -1 });
  res.json(tasks);
});

// Get by id
// @desc Get task by id
router.get("/:id", async (req: Request, res: Response) => {
  const id = validId(req, res);
  if (!id) return;

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// Update by id
// @desc Get task by id
const updateHandler = async (req: Request, res: Response) => {
  const id = validId(req, res);
  if (!id) return;

  const parsed = updateSchema?.safeParse(req?.body);
  if (!parsed?.success) {
    return res.status(400)?.json({
      error: "Validation failed",
      details: z.flattenError(parsed?.error),
    });
  }

  const task = await Task?.findById(id);
  if (!task) return res?.status(404)?.json({ error: "Task not found" });

  // Flag as edited only when the task text actually changes
  if (parsed?.data?.task !== undefined && parsed?.data?.task !== task?.task) {
    task.isEdited = true;
  }

  // if task is completed
  if (parsed?.data?.isCompleted) task.isCompleted = true;

  // if task is important
  if (parsed?.data?.isImportant) task.isImportant = true;

  task?.set(parsed?.data);
  await task.save();

  res.json(task);
};
router.patch("/:id", updateHandler);
router.put("/:id", updateHandler);

// DELETE by id
// @desc delete task by id
router.delete("/:id", async (req: Request, res: Response) => {
  const id = validId(req, res);
  if (!id) return;

  const task = await Task.findByIdAndDelete(id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(204).send();
});

export default router;
