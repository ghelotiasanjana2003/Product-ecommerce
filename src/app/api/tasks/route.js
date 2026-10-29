
import { NextResponse } from "next/server";
import {
    Project,
    ProjectMember,
    Task,
    TaskAssignee,
    User,
    Notification,
} from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

const VALID_STATUSES = ["todo", "in_progress", "completed"];
const VALID_PRIORITIES = ["low", "medium", "high"];

function taskIncludes() {
    return [
        {
            model: TaskAssignee,
            as: "taskAssignees",
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email"],
                },
            ],
        },
        {
            model: Project,
            as: "project",
            attributes: ["id", "name", "owner_id"],
        },
    ];
}

// GET /api/tasks?projectId=6
export async function GET(request) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json(
                { message: "Please log in." },
                { status: 401 }
            );
        }

        const isAdmin =
            String(user.role || "").toLowerCase() === "admin";

        const projectId = new URL(request.url).searchParams.get(
            "projectId"
        );

        let allowedProjectIds;

        if (isAdmin) {
            // Admins can access tasks from every project.
            if (projectId) {
                allowedProjectIds = [String(projectId)];
            } else {
                allowedProjectIds = undefined;
            }
        } else {
            // Regular users remain restricted to their project memberships.
            const memberships = await ProjectMember.findAll({
                where: { user_id: user.id },
                attributes: ["project_id"],
            });

            allowedProjectIds = memberships.map((membership) =>
                String(membership.project_id)
            );

            if (
                projectId &&
                !allowedProjectIds.includes(String(projectId))
            ) {
                return NextResponse.json(
                    { message: "You do not have access to this project." },
                    { status: 403 }
                );
            }
        }

        const where = {};

        if (projectId) {
            where.project_id = String(projectId);
        } else if (allowedProjectIds !== undefined) {
            where.project_id = allowedProjectIds;
        }

        const tasks = await Task.findAll({
            attributes: {
                exclude: ["attachment_data"],
            },
            where,
            include: taskIncludes(),
            order: [["created_at", "DESC"]],
        });

        return NextResponse.json({
            tasks: tasks.map((task) => task.toJSON()),
        });
    } catch (error) {
        console.error("List tasks error:", error);

        return NextResponse.json(
            { message: "Could not load tasks." },
            { status: 500 }
        );
    }
}

// POST /api/tasks
export async function POST(request) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json(
                { message: "Please log in." },
                { status: 401 }
            );
        }
        if (!["admin", "project_owner"].includes(user.role)) {
            return NextResponse.json(
                {
                    message:
                        "Only authorized Project Owners can create tasks.",
                },
                { status: 403 }
            );
        }

        const formData = await request.formData();

        const assigneeIdsValue = formData.get("assignee_ids");

        const body = {
            project_id: formData.get("project_id"),
            title: formData.get("title"),
            description: formData.get("description"),
            status: formData.get("status") || "todo",
            priority: formData.get("priority") || "medium",
            due_date: formData.get("due_date") || null,
        };

        if (assigneeIdsValue !== null) {
            try {
                body.assignee_ids = JSON.parse(assigneeIdsValue);
            } catch {
                return NextResponse.json(
                    { message: "Invalid assignee_ids format." },
                    { status: 400 }
                );
            }
        }
        const projectId = String(body.project_id ?? "");
        const title = typeof body.title === "string" ? body.title.trim() : "";

        if (!/^[1-9]\d*$/.test(projectId) || !title || title.length > 200) {
            return NextResponse.json(
                { message: "A valid project and task title (maximum 200 characters) are required." },
                { status: 400 }
            );
        }

        const project = await Project.findByPk(projectId);

        if (!project) {
            return NextResponse.json(
                { message: "Project not found." },
                { status: 404 }
            );
        }

        const membership = await ProjectMember.findOne({
            where: { project_id: projectId, user_id: user.id },
        });

        if (!membership) {
            return NextResponse.json(
                { message: "You do not have access to this project." },
                { status: 403 }
            );
        }

        const isOwner = String(project.owner_id) === String(user.id);
        const hasAssigneeField = Object.prototype.hasOwnProperty.call(
            body,
            "assignee_ids"
        );

        if (hasAssigneeField && !isOwner) {
            return NextResponse.json(
                { message: "Only the project owner can assign members to a task." },
                { status: 403 }
            );
        }

        const assigneeIds = body.assignee_ids ?? [];

        if (!Array.isArray(assigneeIds)) {
            return NextResponse.json(
                { message: "assignee_ids must be an array." },
                { status: 400 }
            );
        }

        const normalizedIds = [...new Set(assigneeIds.map(String))];

        if (normalizedIds.some((id) => !/^[1-9]\d*$/.test(id))) {
            return NextResponse.json(
                { message: "One or more assignee IDs are invalid." },
                { status: 400 }
            );
        }

        if (normalizedIds.length) {
            const validMembers = await ProjectMember.findAll({
                where: {
                    project_id: projectId,
                    user_id: normalizedIds,
                },
                attributes: ["user_id"],
            });

            if (
                new Set(validMembers.map((m) => String(m.user_id))).size !==
                normalizedIds.length
            ) {
                return NextResponse.json(
                    { message: "Every assignee must be a member of this project." },
                    { status: 400 }
                );
            }
        }

        const status = body.status ?? "todo";
        const priority = body.priority ?? "medium";

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { message: "Invalid task status." },
                { status: 400 }
            );
        }

        if (!VALID_PRIORITIES.includes(priority)) {
            return NextResponse.json(
                { message: "Invalid task priority." },
                { status: 400 }
            );
        }

        const dueDate = body.due_date || null;

        if (
            dueDate !== null &&
            (
                typeof dueDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
                Number.isNaN(Date.parse(`${dueDate}T00:00:00.000Z`)) ||
                new Date(`${dueDate}T00:00:00.000Z`)
                    .toISOString()
                    .slice(0, 10) !== dueDate
            )
        ) {
            return NextResponse.json(
                { message: "Invalid due date." },
                { status: 400 }
            );
        }

        const hoursValue = formData.get("estimated_hours") ?? "0";
        const minutesValue = formData.get("estimated_minutes") ?? "0";

        const hours = Number(hoursValue);
        const minutes = Number(minutesValue);

        if (
            !/^\d+$/.test(String(hoursValue)) ||
            !/^\d+$/.test(String(minutesValue)) ||
            !Number.isSafeInteger(hours) ||
            !Number.isSafeInteger(minutes) ||
            hours < 0 ||
            minutes < 0 ||
            minutes > 59 ||
            hours * 60 + minutes > 4294967295
        ) {
            return NextResponse.json(
                { message: "Enter a valid estimated duration." },
                { status: 400 }
            );
        }

        const estimatedMinutes =
            hours * 60 + minutes || null;

        const attachment = formData.get("attachment");

        let attachmentFields = {
            attachment_name: null,
            attachment_type: null,
            attachment_data: null,
            attachment_size: null,
        };

        if (attachment && attachment.size > 0) {
            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            const allowedTypes = ["application/pdf", "image/jpeg",
                "image/png", "image/webp", "image/gif"];

            if (
                typeof attachment.arrayBuffer !== "function" ||
                !allowedTypes.includes(attachment.type) ||
                attachment.size > MAX_FILE_SIZE
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Upload one JPG, PNG, WEBP, GIF, or PDF file up to 5 MB.",
                    },
                    { status: 400 }
                );
            }

            attachmentFields = {
                attachment_name: attachment.name.slice(0, 255),
                attachment_type: attachment.type,
                attachment_data: Buffer.from(
                    await attachment.arrayBuffer()
                ),
                attachment_size: attachment.size,
            };
        }

        const task = await Task.create({
            project_id: projectId,
            title,
            description:
                typeof body.description === "string"
                    ? body.description.trim() || null
                    : null,
            assigned_to: null,
            status,
            priority,
            due_date: dueDate,
            estimated_minutes: estimatedMinutes,
            ...attachmentFields,
        });

        if (normalizedIds.length) {
            await TaskAssignee.bulkCreate(
                normalizedIds.map((id) => ({
                    task_id: task.id,
                    user_id: id,
                }))
            );
        }
        // Notify newly assigned users, excluding the task creator.
        const recipientIds = normalizedIds.filter(
            (id) => id !== String(user.id)
        );

        if (recipientIds.length > 0) {
            await Notification.bulkCreate(
                recipientIds.map((recipientId) => ({
                    user_id: recipientId,
                    project_id: task.project_id,
                    task_id: task.id,
                    message: `${user.name} assigned you to "${task.title}".`,
                    is_read: false,
                }))
            );
        }

        const createdTask = await Task.findByPk(task.id, {
            attributes: {
                exclude: ["attachment_data"],
            },
            include: taskIncludes(),
        });


        return NextResponse.json(
            {
                message: "Task created successfully.",
                task: createdTask.toJSON(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create task error:", error);

        if (
            error?.errno === 1153 ||
            error?.code === "ER_NET_PACKET_TOO_LARGE" ||
            error?.message?.includes("max_allowed_packet")
        ) {
            return NextResponse.json(
                { error: "File size must not exceed 5 MB. Please upload a smaller file." },
                { status: 413 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create task. Please try again." },
            { status: 500 }
        );
    }
}
