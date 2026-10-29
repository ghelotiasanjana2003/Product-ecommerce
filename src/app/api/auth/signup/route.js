
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "@/models/User";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const signupSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
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

        const parsed = signupSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    message:
                        "Enter a valid name, email, and password of 8–72 characters.",
                },
                { status: 400 }
            );
        }

        const name = parsed.data.name;
        const email = parsed.data.email.toLowerCase();
        const password = parsed.data.password;

        const existingUser = await User.findOne({
            where: { email },
            attributes: ["id"],
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    message: "This email is already registered. Please log in.",
                },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const createdUser = await User.create({
            name,
            email,
            password_hash: passwordHash,
        });

        const user = {
            id: String(createdUser.id),
            name: createdUser.name,
            email: createdUser.email,
        };

        const token = await createSession(user);

        const response = NextResponse.json(
            {
                success: true,
                message: "Account created successfully!",
                user,
            },
            { status: 201 }
        );

        response.cookies.set("session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                {
                    message: "This email is already registered. Please log in.",
                },
                { status: 409 }
            );
        }

        console.error("Signup error:", error.message);

        return NextResponse.json(
            { message: "Unable to create your account right now." },
            { status: 500 }
        );
    }
}
