
import { NextResponse } from "next/server";
import {
    Project,
    ProjectMember,
    Task,
    TaskAssignee,
    User,
    ActivityLog,
    Notification,
} from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

const VALID_STATUSES = ["todo", "in_progress", "completed"];
const VALID_PRIORITIES = ["low", "medium", "high"];

async function getTaskPermission(taskId, userId) {
    const task = await Task.findByPk(taskId, {
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
        return { error: "Task not found.", status: 404 };
    }

    const projectId = String(task.project_id);

    const membership = await ProjectMember.findOne({
        where: { project_id: projectId, user_id: userId },
    });

    if (!membership) {
        return {
            error: "You do not have access to this project.",
            status: 403,
        };
    }

    const isOwner = String(task.project.owner_id) === String(userId);

    const isAssignee =
        (
            task.assigned_to != null &&
            String(task.assigned_to) === String(userId)
        ) ||
        task.taskAssignees.some(
            (assignment) => String(assignment.user_id) === String(userId)
        );

    if (!isOwner && !isAssignee) {
        return {
            error: "You can only edit tasks assigned to you.",
            status: 403,
        };
    }

    return { task, isOwner, isAssignee };
}

// GET /api/tasks/:id
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
            attributes: { exclude: ["attachment_data"] },
            include: [
                {
                    model: Project,
                    as: "project",
                    attributes: ["id", "name", "owner_id"],
                },
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
            ],
        });

        if (!task) {
            return NextResponse.json(
                { message: "Task not found." },
                { status: 404 }
            );
        }

        const isAdmin =
            String(user.role || "").toLowerCase() === "admin";

        const isOwner =
            String(task.project.owner_id) === String(user.id);

        const isAssignee =
            (task.assigned_to != null &&
                String(task.assigned_to) === String(user.id)) ||
            task.taskAssignees.some(
                (assignment) =>
                    String(assignment.user_id) === String(user.id)
            );

        if (!isAdmin && !isOwner && !isAssignee) {
            return NextResponse.json(
                { message: "You do not have access to this task." },
                { status: 403 }
            );
        }

        const owner = await User.findByPk(task.project.owner_id, {
            attributes: ["id", "name", "email"],
        });

        const taskData = task.toJSON();

        taskData.project.owner = owner ? owner.toJSON() : null;

        return NextResponse.json({
            task: taskData,
        });
    } catch (error) {
        console.error("Get task details error:", error);

        return NextResponse.json(
            { message: "Could not load task details." },
            { status: 500 }
        );
    }
}

// PUT /api/tasks/:id
export async function PUT(request, { params }) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json(
                { message: "Please log in." },
                { status: 401 }
            );
        }

        const { id } = await params;
        const permission = await getTaskPermission(id, user.id);

        if (permission.error) {
            return NextResponse.json(
                { message: permission.error },
                { status: permission.status }
            );
        }

        const { task, isOwner, isAssignee } = permission;

        if (!isOwner && !isAssignee) {
            return NextResponse.json(
                { message: "You can only edit tasks assigned to you." },
                { status: 403 }
            );
        }

        const contentType = request.headers.get("content-type") || "";
        let body = {};
        let attachment = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();

            body = {
                title: formData.get("title"),
                description: formData.get("description"),
                due_date: formData.get("due_date") || null,
                priority: formData.get("priority"),
                assignee_ids: JSON.parse(formData.get("assignee_ids") || "[]"),
                estimated_hours: Number(formData.get("estimated_hours") || 0),
                estimated_minutes: Number(formData.get("estimated_minutes") || 0),
                remove_attachment: formData.get("remove_attachment") === "true",
            };

            const uploadedFile = formData.get("attachment");

            if (uploadedFile instanceof File && uploadedFile.size > 0) {
                attachment = uploadedFile;
            }
        } else {
            body = await request.json();
        }

        if (!isOwner) {
            const allowedFields = ["status"];

            const attemptedFields = Object.keys(body);
            const forbiddenFields = attemptedFields.filter(
                (field) => !allowedFields.includes(field)
            );

            if (forbiddenFields.length > 0) {
                return NextResponse.json(
                    {
                        message:
                            "Assigned members can only change task status. Only the project owner can edit task details or assignments.",
                    },
                    { status: 403 }
                );
            }
        }

        // Only the project owner can manage task assignments.
        if (
            Object.prototype.hasOwnProperty.call(body, "assignee_ids") &&
            !isOwner
        ) {
            return NextResponse.json(
                { message: "Only the project owner can change task assignments." },
                { status: 403 }
            );
        }

        const updates = {};

        if (Object.prototype.hasOwnProperty.call(body, "title")) {
            const title = typeof body.title === "string" ? body.title.trim() : "";

            if (!title || title.length > 200) {
                return NextResponse.json(
                    { message: "Task title is required (maximum 200 characters)." },
                    { status: 400 }
                );
            }

            updates.title = title;
        }

        if (Object.prototype.hasOwnProperty.call(body, "description")) {
            updates.description =
                typeof body.description === "string"
                    ? body.description.trim() || null
                    : null;
        }

        if (Object.prototype.hasOwnProperty.call(body, "status")) {
            if (!VALID_STATUSES.includes(body.status)) {
                return NextResponse.json(
                    { message: "Invalid task status." },
                    { status: 400 }
                );
            }

            updates.status = body.status;
        }

        if (Object.prototype.hasOwnProperty.call(body, "priority")) {
            if (!VALID_PRIORITIES.includes(body.priority)) {
                return NextResponse.json(
                    { message: "Invalid task priority." },
                    { status: 400 }
                );
            }

            updates.priority = body.priority;
        }

        if (Object.prototype.hasOwnProperty.call(body, "due_date")) {
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

            updates.due_date = dueDate;
        }
        if (
            Object.prototype.hasOwnProperty.call(body, "estimated_hours") ||
            Object.prototype.hasOwnProperty.call(body, "estimated_minutes")
        ) {
            const hours = Number(body.estimated_hours ?? 0);
            const minutes = Number(body.estimated_minutes ?? 0);

            if (
                !Number.isInteger(hours) ||
                !Number.isInteger(minutes) ||
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

            updates.estimated_minutes = hours * 60 + minutes;
        }

        if (attachment) {
            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
            ];

            if (!allowedTypes.includes(attachment.type)) {
                return NextResponse.json(
                    { message: "Please select an image or PDF file." },
                    { status: 400 }
                );
            }

            if (attachment.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { message: "The attachment must be 5 MB or smaller." },
                    { status: 413 }
                );
            }

            updates.attachment_name = attachment.name;
            updates.attachment_type = attachment.type;
            updates.attachment_size = attachment.size;
            updates.attachment_data = Buffer.from(
                await attachment.arrayBuffer()
            );
        } else if (body.remove_attachment) {
            updates.attachment_name = null;
            updates.attachment_type = null;
            updates.attachment_size = null;
            updates.attachment_data = null;
        }
        if (
            Object.keys(updates).length === 0 &&
            !("assignee_ids" in body)
        ) {
            return NextResponse.json(
                { message: "No task changes were provided." },
                { status: 400 }
            );
        }

        // Save the previous status before applying updates.
        const previousStatus = task.status;

        if (Object.keys(updates).length) {
            await task.update(updates);
        }

        // Record activity and notify project members when status changes.
        if (
            Object.prototype.hasOwnProperty.call(updates, "status") &&
            previousStatus !== updates.status
        ) {
            const statusLabels = {
                todo: "To do",
                in_progress: "In progress",
                completed: "Completed",
            };

            const message = `${user.name} changed "${task.title}" from ${statusLabels[previousStatus] || previousStatus
                } to ${statusLabels[updates.status] || updates.status}.`;

            // Save the activity log.
            const activityLog = await ActivityLog.create({
                user_id: user.id,
                project_id: task.project_id,
                task_id: task.id,
                action: "task_status_changed",
                old_value: previousStatus,
                new_value: updates.status,
                message,
            });

            // Find everyone who belongs to this project.
            const members = await ProjectMember.findAll({
                where: {
                    project_id: task.project_id,
                },
                attributes: ["user_id"],
            });

            // Include the project owner, even if not in project_members.
            const recipientIds = new Set(
                members.map((member) => String(member.user_id))
            );

            recipientIds.add(String(task.project.owner_id));

            // Never notify the person who made the change.
            recipientIds.delete(String(user.id));

            // Create one notification per recipient.
            const notifications = [...recipientIds].map((recipientId) => ({
                user_id: recipientId,
                activity_log_id: activityLog.id,
                project_id: task.project_id,
                task_id: task.id,
                message,
                is_read: false,
            }));

            if (notifications.length > 0) {
                await Notification.bulkCreate(notifications);
            }
        }


        if (Object.prototype.hasOwnProperty.call(body, "assignee_ids")) {
            if (!Array.isArray(body.assignee_ids)) {
                return NextResponse.json(
                    { message: "assignee_ids must be an array." },
                    { status: 400 }
                );
            }

            const ids = [...new Set(body.assignee_ids.map(String))];

            if (ids.some((memberId) => !/^[1-9]\d*$/.test(memberId))) {
                return NextResponse.json(
                    { message: "One or more assignee IDs are invalid." },
                    { status: 400 }
                );
            }

            const members = ids.length
                ? await ProjectMember.findAll({
                    where: {
                        project_id: task.project_id,
                        user_id: ids,
                    },
                    attributes: ["user_id"],
                })
                : [];

            const validMemberIds = new Set(
                members.map((member) => String(member.user_id))
            );

            // The project owner is allowed even if they aren't in project_members.
            validMemberIds.add(String(task.project.owner_id));

            if (ids.some((memberId) => !validMemberIds.has(memberId))) {
                return NextResponse.json(
                    {
                        message:
                            "Every assignee must be a member of this project or its owner.",
                    },
                    { status: 400 }
                );
            }
            // Remember current assignees before replacing them.
            const previousAssignees = await TaskAssignee.findAll({
                where: { task_id: task.id },
                attributes: ["user_id"],
            });

            const previousAssigneeIds = new Set(
                previousAssignees.map((item) => String(item.user_id))
            );
            await TaskAssignee.destroy({
                where: { task_id: task.id },
            });

            if (ids.length) {
                await TaskAssignee.bulkCreate(
                    ids.map((memberId) => ({
                        task_id: task.id,
                        user_id: memberId,
                    }))
                );
            }

            // Notify users who have just been assigned this task.
            const newlyAssignedIds = ids.filter(
                (memberId) =>
                    !previousAssigneeIds.has(memberId) &&
                    memberId !== String(user.id)
            );

            if (newlyAssignedIds.length > 0) {
                const assignmentNotifications = newlyAssignedIds.map(
                    (recipientId) => ({
                        user_id: recipientId,
                        project_id: task.project_id,
                        task_id: task.id,
                        message: `${user.name} assigned you to "${task.title}".`,
                        is_read: false,
                    })
                );

                await Notification.bulkCreate(assignmentNotifications);
            }

        }

        const updatedTask = await Task.findByPk(task.id, {
            include: [
                {
                    model: Project,
                    as: "project",
                    attributes: ["id", "name", "owner_id"],
                },
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
            ],
        });

        return NextResponse.json({
            message: "Task updated successfully.",
            task: updatedTask.toJSON(),
        });
    } catch (error) {
        console.error("Update task error:", error);

        return NextResponse.json(
            { message: "Could not update task." },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/:id
export async function DELETE(request, { params }) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json(
                { message: "Please log in." },
                { status: 401 }
            );
        }

        const { id } = await params;
        const permission = await getTaskPermission(id, user.id);

        if (permission.error) {
            return NextResponse.json(
                { message: permission.error },
                { status: permission.status }
            );
        }

        if (!permission.isOwner) {
            return NextResponse.json(
                { message: "Only the project owner can delete tasks." },
                { status: 403 }
            );
        }

        await permission.task.destroy();

        return NextResponse.json({
            message: "Task deleted successfully.",
        });
    } catch (error) {
        console.error("Delete task error:", error);

        return NextResponse.json(
            { message: "Could not delete task." },
            { status: 500 }
        );
    }
}