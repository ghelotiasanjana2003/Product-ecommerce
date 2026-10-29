
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS databaseName"
    );

    return NextResponse.json({
      success: true,
      message: "Database connected successfully!",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    return NextResponse.json(
      { success: false, message: "Database connection failed." },
      { status: 500 }
    );
  }
}
