
import "server-only";
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const TaskComment =
  sequelize.models.TaskComment ||
  sequelize.define(
    "TaskComment",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      task_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      parent_comment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      mentions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "task_comments",
      timestamps: false,
    }
  );

export default TaskComment;
