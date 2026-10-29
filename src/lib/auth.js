
import "server-only";

import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import User from "@/models/User";

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    const payload = await verifySession(token);

    if (!payload?.sub) return null;

    const user = await User.findByPk(payload.sub, {
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "is_active",
      ],
    });

    // Reject missing or deactivated accounts.
    if (!user || !user.is_active) return null;

    return user;
  } catch (error) {
    console.error("Authentication lookup error:", error);
    throw error;
  }
}
