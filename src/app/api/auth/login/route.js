
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "@/models/User";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Enter a valid email and password." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const dbUser = await User.findOne({
      where: { email },
      attributes: ["id", "name", "email", "password_hash"],
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      dbUser.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = {
      id: String(dbUser.id),
      name: dbUser.name,
      email: dbUser.email,
    };

    const token = await createSession(user);

    const response = NextResponse.json({
      success: true,
      message: "Login successful!",
      user,
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error.message);

    return NextResponse.json(
      { message: "Unable to log in right now." },
      { status: 500 }
    );
  }
}
