import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI: string = process.env.MONGODB_URI as string;
const MONGODB_DB: string = process.env.MONGODB_DB as string; // Add DB Name

if (!MONGODB_URI) {
  throw new Error("MongoDB URI is not defined in environment variables.");
}

// Global cache to prevent multiple connections in development
declare global {
  var mongoClient: { conn: MongoClient | null; promise: Promise<MongoClient> | null };
}

let cached = global.mongoClient || { conn: null, promise: null };

export async function connectToDatabase(): Promise<MongoClient> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = new MongoClient(MONGODB_URI).connect().then((client) => {
      console.log("MongoDB connected successfully.");
      return client;
    });
  }

  cached.conn = await cached.promise;

  if (process.env.NODE_ENV !== "production") {
    global.mongoClient = cached;
  }

  return cached.conn;
}
