// src/app/api/projects/[id]/route.js
import { NextResponse } from "next/server";
import {
    Project,
    ProjectMember,
    User,
    ActivityLog,
    Notification,
} from "@/models";
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

        if (!/^[1-9]\d*$/.test(id)) {
            return NextResponse.json(
                { message: "Invalid project ID." },
                { status: 400 }
            );
        }

        const membership = await ProjectMember.findOne({
            where: {
                project_id: id,
                user_id: user.id,
            },
            include: [
                {
                    model: Project,
                    as: "project",
                    required: true,
                    include: [
                        {
                            model: User,
                            as: "owner",
                            attributes: ["id", "name"],
                        },
                    ],
                },
            ],
        });

        if (!membership) {
            return NextResponse.json(
                { message: "Project not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            project: {
                ...membership.project.toJSON(),
                role: membership.role,
            },
        });
    }
    catch (error) {
        console.error("List projects error:", error);

        return NextResponse.json(
            {
                message: "Could not load projects.",
                error: error.message,
            },
            { status: 500 }
        );
    }
}


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

        if (!/^[1-9]\d*$/.test(id)) {
            return NextResponse.json(
                { message: "Invalid project ID." },
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

        // Check whether the project exists.
        const project = await Project.findByPk(id);

        if (!project) {
            return NextResponse.json(
                { message: "This project could not be found." },
                { status: 404 }
            );
        }

        // Only the project owner can edit project details or assignments.
        if (String(project.owner_id) !== String(user.id)) {
            return NextResponse.json(
                {
                    message:
                        "You cannot edit this project because only the project owner can change project details or assign team members.",
                    code: "PROJECT_OWNER_REQUIRED",
                },
                { status: 403 }
            );
        }

        // Only the project owner can edit project details or assignments.
        if (String(project.owner_id) !== String(user.id)) {
            return NextResponse.json(
                {
                    message:
                        "You cannot edit this project because only the project owner can change project details or assign team members.",
                    code: "PROJECT_OWNER_REQUIRED",
                },
                { status: 403 }
            );
        }

        // ADD THIS CODE IMMEDIATELY AFTER THE PERMISSION CHECK
        const oldProject = {
            name: project.name,
            description: project.description,
            due_date: project.due_date
                ? String(project.due_date).slice(0, 10)
                : null,
        };

        const oldMemberships = await ProjectMember.findAll({
            where: { project_id: id },
            attributes: ["user_id"],
        });

        const oldMemberIds = new Set(
            oldMemberships.map((member) => String(member.user_id))
        );

        // Your existing "// Validate project name" code continues below.

        // Validate project name.
        const name =
            typeof body.name === "string" ? body.name.trim() : "";

        if (name.length < 2 || name.length > 150) {
            return NextResponse.json(
                { message: "Name must be 2–150 characters." },
                { status: 400 }
            );
        }

        const description =
            typeof body.description === "string"
                ? body.description.trim() || null
                : null;

        // Validate due date.
        const dueDate = body.due_date || null;

        if (dueDate !== null) {
            if (
                typeof dueDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
                Number.isNaN(Date.parse(dueDate)) ||
                new Date(`${dueDate}T00:00:00.000Z`)
                    .toISOString()
                    .slice(0, 10) !== dueDate
            ) {
                return NextResponse.json(
                    { message: "Invalid due date." },
                    { status: 400 }
                );
            }
        }

        // Validate selected member IDs.
        if (
            !Array.isArray(body.memberIds) ||
            body.memberIds.some(
                (id) => !/^[1-9]\d*$/.test(String(id))
            )
        ) {
            console.error("Invalid member IDs:", body.memberIds);

            return NextResponse.json(
                { message: "Invalid member IDs." },
                { status: 400 }
            );
        }

        // Keep the project owner assigned.
        const memberIds = [
            ...new Set([
                String(user.id),
                ...body.memberIds.map(String),
            ]),
        ];

        const validUsers = await User.findAll({
            where: { id: memberIds },
            attributes: ["id"],
        });

        if (validUsers.length !== memberIds.length) {
            return NextResponse.json(
                { message: "One or more selected users do not exist." },
                { status: 400 }
            );
        }

        // Save project details and membership changes together.
        const updatedProject = await project.sequelize.transaction(
            async (transaction) => {
                await project.update(
                    {
                        name,
                        description,
                        due_date: dueDate,
                    },
                    { transaction }
                );

                // Remove memberships that are no longer selected.
                await ProjectMember.destroy({
                    where: { project_id: id },
                    transaction,
                });

                // Add the currently selected members.

                await ProjectMember.bulkCreate(
                    memberIds.map((memberId) => ({
                        project_id: id,
                        user_id: memberId,
                    })),
                    { transaction }
                );

                // Log project field changes
                const changes = [
                    {
                        action: "project_name_updated",
                        label: "name",
                        oldValue: oldProject.name,
                        newValue: name,
                    },
                    {
                        action: "project_description_updated",
                        label: "description",
                        oldValue: oldProject.description,
                        newValue: description,
                    },
                    {
                        action: "project_due_date_updated",
                        label: "due date",
                        oldValue: oldProject.due_date,
                        newValue: dueDate,
                    },
                ];

                for (const change of changes) {
                    if ((change.oldValue ?? null) !== (change.newValue ?? null)) {
                        await ActivityLog.create(
                            {
                                user_id: user.id,
                                project_id: project.id,
                                task_id: null,
                                action: change.action,
                                old_value:
                                    change.oldValue == null
                                        ? null
                                        : String(change.oldValue).slice(0, 255),
                                new_value:
                                    change.newValue == null
                                        ? null
                                        : String(change.newValue).slice(0, 255),
                                message: `${user.name} changed project ${change.label} from "${change.oldValue ?? "empty"}" to "${change.newValue ?? "empty"}".`,
                            },
                            { transaction }
                        );
                    }
                }

                // Log added project members
                const addedMemberIds = memberIds.filter(
                    (memberId) => !oldMemberIds.has(memberId)
                );

                for (const memberId of addedMemberIds) {
                    await ActivityLog.create(
                        {
                            user_id: user.id,
                            project_id: project.id,
                            task_id: null,
                            action: "project_member_added",
                            old_value: null,
                            new_value: String(memberId),
                            message: `${user.name} added user ID ${memberId} to project "${name}".`,
                        },
                        { transaction }
                    );
                }

                // Log removed project members
                const removedMemberIds = [...oldMemberIds].filter(
                    (memberId) => !memberIds.includes(memberId)
                );

                for (const memberId of removedMemberIds) {
                    await ActivityLog.create(
                        {
                            user_id: user.id,
                            project_id: project.id,
                            task_id: null,
                            action: "project_member_removed",
                            old_value: String(memberId),
                            new_value: null,
                            message: `${user.name} removed user ID ${memberId} from project "${name}".`,
                        },
                        { transaction }
                    );
                }

                // Notify project members about project updates.
                const changedProject =
                    changes.some(
                        (change) =>
                            (change.oldValue ?? null) !==
                            (change.newValue ?? null)
                    );

                const notificationRecipientIds = new Set(
                    memberIds.map(String)
                );

                // Include the project owner.
                notificationRecipientIds.add(String(project.owner_id));

                // Do not notify the person who made the change.
                notificationRecipientIds.delete(String(user.id));

                if (changedProject || addedMemberIds.length > 0) {
                    const notificationMessage = changedProject
                        ? `${user.name} updated project "${name}".`
                        : `${user.name} updated the team for project "${name}".`;

                    const notifications = [...notificationRecipientIds].map(
                        (recipientId) => ({
                            user_id: recipientId,
                            project_id: project.id,
                            task_id: null,
                            message: notificationMessage,
                            is_read: false,
                        })
                    );

                    if (notifications.length > 0) {
                        await Notification.bulkCreate(notifications, {
                            transaction,
                        });
                    }
                }

                return project;
            }
        );

        return NextResponse.json({
            message: "Project updated successfully.",
            project: {
                ...updatedProject.toJSON(),
                members: memberIds,
            },
        });
    } catch (error) {
        console.error("Update project error:", error);

        return NextResponse.json(
            { message: "Could not update project." },
            { status: 500 }
        );
    }
}

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

        if (!/^[1-9]\d*$/.test(id)) {
            return NextResponse.json(
                { message: "Invalid project ID." },
                { status: 400 }
            );
        }

        // Only the project owner can delete it.
        const project = await Project.findOne({
            where: {
                id,
                owner_id: user.id,
            },
        });

        if (!project) {
            return NextResponse.json(
                {
                    message: "Project not found or you are not the owner.",
                },
                { status: 404 }
            );
        }

        // Delete memberships first, then the project.
        await project.sequelize.transaction(async (transaction) => {
            await ProjectMember.destroy({
                where: { project_id: id },
                transaction,
            });

            await project.destroy({ transaction });
        });

        return NextResponse.json({
            message: "Project deleted successfully.",
            id: String(id),
        });
    } catch (error) {
        console.error("Delete project error:", error);

        return NextResponse.json(
            { message: "Could not delete project." },
            { status: 500 }
        );
    }
}
