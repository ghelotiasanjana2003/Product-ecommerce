
import { NextResponse } from "next/server";
import { User } from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      error: NextResponse.json(
        { message: "Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

// GET /api/admin/users
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "is_active",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user.toJSON(),
        id: String(user.id),
        is_active: Boolean(user.is_active),
      })),
    });
  } catch (error) {
    console.error("Admin list users error:", error);

    return NextResponse.json(
      { message: "Could not load registered users." },
      { status: 500 }
    );
  }
}
