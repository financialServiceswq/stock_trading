import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI: string = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("MongoDB URI is not defined in environment variables.");
}

// Ensure global caching exists in development mode
declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

// Use global caching to prevent multiple connections in development mode
let cached = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
      })
      .then((m) => {
        console.log("✅ MongoDB connected successfully.");
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Event listeners for debugging
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB encountered an error:", err);
});
