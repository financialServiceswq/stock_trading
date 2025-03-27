import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MongoDB URI is not defined in environment variables.");
}

// Define a global type for caching the connection
declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

// Use global caching to prevent multiple connections in development mode
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  global.mongooseCache || { conn: null, promise: null };

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => {
        console.log("MongoDB connected successfully.");
        return m;
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;

  // Store the cached connection globally in development mode
  if (process.env.NODE_ENV !== "production") {
    global.mongooseCache = cached;
  }

  return cached.conn;
}

// Event listeners for better debugging
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB encountered an error:", err);
});
