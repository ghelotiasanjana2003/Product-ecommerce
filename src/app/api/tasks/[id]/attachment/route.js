
import { NextResponse } from "next/server";
import { Task, Project, ProjectMember, TaskAssignee } from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const task = await Task.findByPk(id, {
      attributes: [
        "id",
        "project_id",
        "assigned_to",
        "attachment_name",
        "attachment_type",
        "attachment_data",
      ],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "owner_id"],
        },
        {
          model: TaskAssignee,
          as: "taskAssignees",
          attributes: ["user_id"],
        },
      ],
    });

    if (!task) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }

    const membership = await ProjectMember.findOne({
      where: {
        project_id: task.project_id,
        user_id: user.id,
      },
    });

    const isOwner =
      String(task.project.owner_id) === String(user.id);

    const isAssignee =
      (task.assigned_to != null &&
        String(task.assigned_to) === String(user.id)) ||
      (task.taskAssignees || []).some(
        (assignment) =>
          String(assignment.user_id) === String(user.id)
      );

    if (!membership && !isOwner) {
      return NextResponse.json(
        { message: "You do not have access to this project." },
        { status: 403 }
      );
    }

    if (!isOwner && !isAssignee) {
      return NextResponse.json(
        { message: "You do not have permission to access this attachment." },
        { status: 403 }
      );
    }

    if (!task.attachment_data || !task.attachment_name) {
      return NextResponse.json(
        { message: "No attachment found for this task." },
        { status: 404 }
      );
    }

    const allowedTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

    const contentType = allowedTypes.has(task.attachment_type)
      ? task.attachment_type
      : "application/octet-stream";

    const filename = String(task.attachment_name)
      .replace(/[\r\n"]/g, "_")
      .replace(/[^\x20-\x7E]/g, "_");

    const fileBuffer = Buffer.from(task.attachment_data);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Get task attachment error:", error);

    return NextResponse.json(
      { message: "Could not retrieve the attachment." },
      { status: 500 }
    );
  }
}
