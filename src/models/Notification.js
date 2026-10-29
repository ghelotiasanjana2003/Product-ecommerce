
import "server-only";
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const Notification =
  sequelize.models.Notification ||
  sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      activity_log_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      task_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      message: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "notifications",
      timestamps: false,
    }
  );

export default Notification;
