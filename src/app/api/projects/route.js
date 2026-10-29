// src/app/api/projects/route.js
import { NextResponse } from "next/server";
import {
  sequelize,
  Project,
  ProjectMember,
  User,
  Notification,
  ActivityLog,
} from "@/models";

import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
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

    let projects;

    if (isAdmin) {
      // Admins can see every project, whether or not
      // they are a member of that project.
      const allProjects = await Project.findAll({
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "name"],
            required: false,
          },
          {
            model: ProjectMember,
            as: "projectMemberships",
            attributes: ["user_id", "role"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      projects = allProjects.map((item) => {
        const project = item.toJSON();

        return {
          ...project,
          id: String(project.id),
          role: "admin",
          owner: project.owner
            ? {
                id: String(project.owner.id),
                name: project.owner.name,
              }
            : null,
          members: (project.projectMemberships || []).map(
            (member) => String(member.user_id)
          ),
        };
      });
    } else {
      // Non-admin users only see projects they belong to.
      const memberships = await ProjectMember.findAll({
        where: { user_id: user.id },
        attributes: ["role"],
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
                required: false,
              },
              {
                model: ProjectMember,
                as: "projectMemberships",
                attributes: ["user_id", "role"],
                required: false,
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      projects = memberships.map((membership) => {
        const project = membership.project.toJSON();

        return {
          ...project,
          id: String(project.id),
          role: membership.role,
          owner: project.owner
            ? {
                id: String(project.owner.id),
                name: project.owner.name,
              }
            : null,
          members: (project.projectMemberships || []).map(
            (member) => String(member.user_id)
          ),
        };
      });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("List projects error:", error);

    return NextResponse.json(
      { message: "Could not load projects." },
      { status: 500 }
    );
  }
}

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
            "Only admins and project owners can create projects.",
        },
        { status: 403 }
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

    // Validate project name
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2 || name.length > 150) {
      return NextResponse.json(
        { message: "Name must be 2–150 characters." },
        { status: 400 }
      );
    }

    // Validate description
    const description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;

    // Validate due date (YYYY-MM-DD)
    const dueDate = body.due_date || null;

    if (dueDate !== null) {
      if (
        typeof dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        Number.isNaN(Date.parse(dueDate)) ||
        new Date(dueDate).toISOString().slice(0, 10) !== dueDate
      ) {
        return NextResponse.json(
          { message: "Invalid due date." },
          { status: 400 }
        );
      }
    }

    // Validate selected team member IDs
    const submittedIds = Array.isArray(body.memberIds)
      ? body.memberIds
      : [];

    if (
      submittedIds.some(
        (id) =>
          !["string", "number"].includes(typeof id) ||
          !/^\d+$/.test(String(id))
      )
    ) {
      return NextResponse.json(
        { message: "Invalid member IDs." },
        { status: 400 }
      );
    }

    // Always include the project owner
    const memberIds = [
      ...new Set([
        String(user.id),
        ...submittedIds.map(String),
      ]),
    ];

    // Ensure all selected users exist
    const validUsers = await User.findAll({
      where: { id: memberIds },
      attributes: ["id"],
    });

    if (validUsers.length !== memberIds.length) {
      return NextResponse.json(
        {
          message:
            "One or more selected users do not exist. Please select valid team members.",
        },
        { status: 400 }
      );
    }

    // Create project and memberships in one transaction
    const project = await sequelize.transaction(
      async (transaction) => {
        const newProject = await Project.create(
          {
            name,
            description,
            owner_id: user.id,
            due_date: dueDate,
          },
          { transaction }
        );

        await ProjectMember.bulkCreate(
          memberIds.map((memberId) => ({
            project_id: newProject.id,
            user_id: memberId,
            role:
              memberId === String(user.id)
                ? "owner"
                : "member",
          })),
          { transaction }
        );

        await ActivityLog.create(
          {
            user_id: user.id,
            project_id: newProject.id,
            task_id: null,
            action: "project_created",
            old_value: null,
            new_value: newProject.name,
            message: `${user.name} created project "${newProject.name}".`,
          },
          { transaction }
        );
        return newProject;
      }
    );
    // Notify newly added project members, excluding the creator.
    const recipientIds = memberIds.filter(
      (memberId) => memberId !== String(user.id)
    );

    if (recipientIds.length > 0) {
      await Notification.bulkCreate(
        recipientIds.map((recipientId) => ({
          user_id: recipientId,
          project_id: project.id,
          message: `${user.name} added you to the project "${project.name}".`,
          is_read: false,
        }))
      );
    }
    return NextResponse.json(
      {
        message: "Project created successfully.",
        project: {
          ...project.toJSON(),
          id: String(project.id),
          owner_id: String(project.owner_id),
          members: memberIds,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);

    return NextResponse.json(
      { message: "Could not create project." },
      { status: 500 }
    );
  }
}