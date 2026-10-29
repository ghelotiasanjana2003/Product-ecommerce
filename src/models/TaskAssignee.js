
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const TaskAssignee = sequelize.define(
  "TaskAssignee",
  {
    task_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    tableName: "task_assignees",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default TaskAssignee;
