import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { getAuthenticatedUser } from "@/lib/auth";
import {
    ActivityLog,
    User,
    Project,
    Task,
} from "@/models";

export async function GET(request) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { message: "Please log in." },
                { status: 401 }
            );
        }

        if (currentUser.role !== "admin") {
            return NextResponse.json(
                { message: "Admin access required." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const action = searchParams.get("action") || "";
        const projectId = searchParams.get("projectId") || "";
        const limit = Math.min(
            Math.max(Number(searchParams.get("limit")) || 50, 1),
            100
        );

        const where = {};

        if (action) {
            where.action = action;
        }

        if (projectId) {
            where.project_id = projectId;
        }


        if (search) {
            where[Op.or] = [
                { message: { [Op.like]: `%${search}%` } },
                { action: { [Op.like]: `%${search}%` } },
            ];
        }


        const logs = await ActivityLog.findAll({
            where,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email"],
                    required: false,
                },
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
            limit,
        });

        return NextResponse.json({
            logs: logs.map((log) => log.toJSON()),
        });
    } catch (error) {
        console.error("Admin activity logs error:", error);

        return NextResponse.json(
            { message: "Could not load activity history." },
            { status: 500 }
        );
    }
}