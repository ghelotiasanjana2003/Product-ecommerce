
import { NextResponse } from "next/server";
import {
  Notification,
  Project,
  Task,
  sequelize,
} from "@/models";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const notifications = await Notification.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Task,
          as: "task",
          attributes: ["id", "title"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    const unreadCount = await Notification.count({
      where: {
        user_id: user.id,
        is_read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const notificationId = body.notificationId;

    if (!notificationId) {
      return NextResponse.json(
        { message: "notificationId is required" },
        { status: 400 }
      );
    }

    const [updatedCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          id: notificationId,
          user_id: user.id,
        },
      }
    );

    if (!updatedCount) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    const unreadCount = await Notification.count({
      where: {
        user_id: user.id,
        is_read: false,
      },
    });

    return NextResponse.json({
      message: "Notification marked as read",
      unreadCount,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return NextResponse.json(
      { message: "Failed to update notification" },
      { status: 500 }
    );
  }
}
