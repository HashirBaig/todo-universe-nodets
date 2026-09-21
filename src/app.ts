import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./db";
import taskRoutes from "./routes/tasks";
import userRoutes from "./routes/users";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Todo API", tasks: "/api/tasks" });
});

// Make sure MongoDB is connected before any /api route runs
app.use("/api", async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
