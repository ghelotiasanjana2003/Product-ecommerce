import { NextResponse } from "next/server";
import { User } from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const users = await User.findAll({
      attributes: ["id", "name", "email"],
      order: [["name", "ASC"]],
    });

    return NextResponse.json({
      users: users.map((user) => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
      })),
    });
  } catch (error) {
    console.error("List users error:", error);

    return NextResponse.json(
      { message: "Could not load users." },
      { status: 500 }
    );
  }
}