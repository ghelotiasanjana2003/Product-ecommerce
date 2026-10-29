
import { NextResponse } from "next/server";
import {
  Task,
  TaskAssignee,
  TaskComment,
  User,
  Project,
  Notification,
  ActivityLog,
} from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

async function checkTaskAccess(taskId, user) {
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

  if (!task || !task.project) {
    return { error: "Task not found.", status: 404 };
  }

  const userId = String(user.id);
  const isAdmin =
    String(user.role || "").toLowerCase() === "admin";
  const isOwner =
    String(task.project.owner_id) === userId;

  const assignments = task.taskAssignees || [];

  const isAssignee =
    (task.assigned_to != null &&
      String(task.assigned_to) === userId) ||
    assignments.some(
      (assignment) => String(assignment.user_id) === userId
    );

  if (!isAdmin && !isOwner && !isAssignee) {
    return {
      error: "You do not have access to this task discussion.",
      status: 403,
    };
  }

  return { task, isAdmin, isOwner, isAssignee };
}

async function getEligibleMentionUsers(task) {
  const allowedIds = new Set(
    (task.taskAssignees || []).map((item) =>
      String(item.user_id)
    )
  );

  if (task.assigned_to != null) {
    allowedIds.add(String(task.assigned_to));
  }

  if (task.project?.owner_id != null) {
    allowedIds.add(String(task.project.owner_id));
  }

  const users = await User.findAll({
    attributes: ["id", "name", "email", "role"],
  });

  return users
    .filter(
      (person) =>
        allowedIds.has(String(person.id)) ||
        String(person.role || "").toLowerCase() === "admin"
    )
    .map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
    }));
}

async function createActivityLog({
  userId,
  projectId,
  taskId,
  action,
  message,
}) {
  try {
    await ActivityLog.create({
      user_id: userId,
      project_id: projectId,
      task_id: taskId,
      action,
      old_value: null,
      new_value: null,
      message: message.slice(0, 500),
    });
  } catch (error) {
    // A logging failure should not undo an already-saved comment.
    console.error("Task comment activity log error:", error);
  }
}

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
    const access = await checkTaskAccess(id, user);

    if (access.error) {
      return NextResponse.json(
        { message: access.error },
        { status: access.status }
      );
    }

    const comments = await TaskComment.findAll({
      where: {
        task_id: id,
        parent_comment_id: null,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
        {
          model: TaskComment,
          as: "replies",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const mentionUsers = await getEligibleMentionUsers(access.task);

    return NextResponse.json({
      comments: comments.map((comment) => comment.toJSON()),
      mentionUsers,
    });
  } catch (error) {
    console.error("Load task comments error:", error);

    return NextResponse.json(
      { message: "Could not load task comments." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const access = await checkTaskAccess(id, user);

    if (access.error) {
      return NextResponse.json(
        { message: access.error },
        { status: access.status }
      );
    }

    const body = await request.json();
    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { message: "Comment cannot be empty." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { message: "Comment must be 5000 characters or fewer." },
        { status: 400 }
      );
    }

    let parentComment = null;
    let parentCommentId = null;

    if (body.parent_comment_id != null) {
      parentComment = await TaskComment.findOne({
        where: {
          id: body.parent_comment_id,
          task_id: id,
          parent_comment_id: null,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          {
            message:
              "The comment you are replying to was not found.",
          },
          { status: 400 }
        );
      }

      parentCommentId = parentComment.id;
    }

    const eligibleUsers = await getEligibleMentionUsers(
      access.task
    );

    const eligibleIds = new Set(
      eligibleUsers.map((person) => String(person.id))
    );

    const requestedMentions = Array.isArray(body.mentions)
      ? body.mentions.map(String)
      : [];

    const mentionIds = [
      ...new Set(requestedMentions),
    ].filter(
      (mentionedId) =>
        mentionedId !== String(user.id) &&
        eligibleIds.has(mentionedId)
    );

    const comment = await TaskComment.create({
      task_id: id,
      user_id: user.id,
      parent_comment_id: parentCommentId,
      mentions: mentionIds.length ? mentionIds : null,
      message,
    });

    const taskTitle = access.task.title || "Untitled task";
    const authorName = user.name || "A teammate";

    // Record the comment or reply in Activity History.
    const action = parentCommentId
      ? "task_comment_reply"
      : mentionIds.length
        ? "task_comment_mentioned"
        : "task_comment_created";

    let activityMessage;

    if (parentCommentId) {
      activityMessage =
        `${authorName} replied to a comment on "${taskTitle}".`;
    } else if (mentionIds.length) {
      activityMessage =
        `${authorName} commented on "${taskTitle}" and mentioned teammates.`;
    } else {
      activityMessage =
        `${authorName} commented on "${taskTitle}".`;
    }

    await createActivityLog({
      userId: user.id,
      projectId: access.task.project_id,
      taskId: access.task.id,
      action,
      message: activityMessage,
    });

    // Notify assigned members, the owner, admins, mentioned users,
    // and (for replies) the parent comment author.
    const notificationUserIds = new Set(
      eligibleUsers.map((person) => String(person.id))
    );

    for (const mentionedId of mentionIds) {
      notificationUserIds.add(String(mentionedId));
    }

    if (
      parentComment &&
      String(parentComment.user_id) !== String(user.id)
    ) {
      notificationUserIds.add(String(parentComment.user_id));
    }

    notificationUserIds.delete(String(user.id));

    if (notificationUserIds.size > 0) {
      let notificationMessage;

      if (parentCommentId) {
        notificationMessage =
          `${authorName} replied to a comment on "${taskTitle}".`;
      } else if (mentionIds.length) {
        notificationMessage =
          `${authorName} commented on "${taskTitle}" and mentioned you.`;
      } else {
        notificationMessage =
          `${authorName} added a comment to "${taskTitle}".`;
      }

      await Notification.bulkCreate(
        [...notificationUserIds].map((recipientId) => ({
          user_id: recipientId,
          project_id: access.task.project_id,
          task_id: access.task.id,
          message: notificationMessage.slice(0, 500),
          is_read: false,
        }))
      );
    }

    const savedComment = await TaskComment.findByPk(
      comment.id,
      {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name"],
          },
        ],
      }
    );

    return NextResponse.json(
      { comment: savedComment.toJSON() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create task comment error:", error);

    return NextResponse.json(
      { message: "Could not post comment." },
      { status: 500 }
    );
  }
}
