import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

// Timeout wrapper
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to DB with timeout
    await withTimeout(connectToDatabase(), 5000);

    // Check if user exists
    console.time("Find User");
    const existingUser = await User.findOne({ email }).lean();
    console.timeEnd("Find User");

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password with reduced cost
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create user with timeout
    console.time("Create User");
    const user = await withTimeout(
      User.create({
        name,
        email,
        password: hashedPassword,
        wallet: { balance: 10000, currency: "USD" },
        portfolio: [],
        watchlist: [],
      }),
      5000
    );
    console.timeEnd("Create User");

    // Return response without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
