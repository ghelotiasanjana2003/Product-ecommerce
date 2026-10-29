
import { NextResponse } from "next/server";
import sequelize from "@/lib/sequelize";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    await sequelize.authenticate();

    const userCount = await User.count();

    return NextResponse.json({
      success: true,
      message: "Sequelize connected successfully!",
      database: sequelize.config.database,
      userCount,
    });
  } catch (error) {
    console.error("Sequelize error:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Sequelize connection failed.",
      },
      { status: 500 }
    );
  }
}
