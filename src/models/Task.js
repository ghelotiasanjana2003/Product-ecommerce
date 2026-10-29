
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("todo", "in_progress", "completed"),
      allowNull: false,
      defaultValue: "todo",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "medium",
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // Estimated task duration, stored in minutes
    estimated_minutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    // Optional attachment stored in MariaDB
    attachment_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    attachment_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    attachment_data: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },
    attachment_size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Task;
