import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Cache the connection on globalThis so warm serverless invocations reuse it
// instead of opening a new connection on every request.
const g = globalThis as typeof globalThis & { _mongooseCache?: MongooseCache };
const cache: MongooseCache = (g._mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");

  cache.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
    dbName: "todo-universe",
  });

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
