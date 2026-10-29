
import { NextResponse } from "next/server";
import { User } from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

const ASSIGNABLE_ROLES = ["project_owner", "project_member"];

// PUT /api/admin/users/:id
export async function PUT(request, { params }) {
  try {
    const admin = await getAuthenticatedUser();

    if (!admin) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    if (admin.role !== "admin" || !admin.is_active) {
      return NextResponse.json(
        { message: "Active admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!/^[1-9]\d*$/.test(String(id))) {
      return NextResponse.json(
        { message: "Invalid user ID." },
        { status: 400 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const hasStatus = Object.hasOwn(body, "is_active");
    const hasRole = Object.hasOwn(body, "role");

    if (hasStatus === hasRole) {
      return NextResponse.json(
        { message: "Provide either is_active or role." },
        { status: 400 }
      );
    }

    const target = await User.findByPk(id);

    if (!target) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    // Role assignment: admins can grant or revoke project-owner access.
    if (hasRole) {
      if (!ASSIGNABLE_ROLES.includes(body.role)) {
        return NextResponse.json(
          {
            message:
              "Role must be project_owner or project_member.",
          },
          { status: 400 }
        );
      }

      if (target.role === "admin") {
        return NextResponse.json(
          {
            message:
              "This action cannot change an administrator's role.",
          },
          { status: 400 }
        );
      }

      if (!target.is_active) {
        return NextResponse.json(
          {
            message:
              "Activate this account before changing its role.",
          },
          { status: 400 }
        );
      }

      await target.update({ role: body.role });

      return NextResponse.json({
        message:
          body.role === "project_owner"
            ? `${target.name} can now create projects and tasks.`
            : `${target.name} no longer has project-owner permissions.`,
        user: {
          id: String(target.id),
          name: target.name,
          email: target.email,
          role: target.role,
          is_active: Boolean(target.is_active),
          created_at: target.created_at,
        },
      });
    }

    // Existing account activation/deactivation behavior.
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { message: "is_active must be true or false." },
        { status: 400 }
      );
    }

    if (
      String(target.id) === String(admin.id) &&
      body.is_active === false
    ) {
      return NextResponse.json(
        { message: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    if (
      target.role === "admin" &&
      target.is_active &&
      body.is_active === false
    ) {
      const activeAdminCount = await User.count({
        where: {
          role: "admin",
          is_active: true,
        },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { message: "You cannot deactivate the last active Admin." },
          { status: 400 }
        );
      }
    }

    await target.update({ is_active: body.is_active });

    return NextResponse.json({
      message: body.is_active
        ? "User activated successfully."
        : "User deactivated successfully.",
      user: {
        id: String(target.id),
        name: target.name,
        email: target.email,
        role: target.role,
        is_active: Boolean(target.is_active),
        created_at: target.created_at,
      },
    });
  } catch (error) {
    console.error("Admin update user error:", error);

    return NextResponse.json(
      { message: "Could not update user." },
      { status: 500 }
    );
  }
}
