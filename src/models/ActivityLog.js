// src/models/ActivityLog.js
import "server-only";
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const ActivityLog =
    sequelize.models.ActivityLog ||
    sequelize.define(
        "ActivityLog",
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

            project_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            task_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            action: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },

            old_value: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            new_value: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            message: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "activity_logs",
            timestamps: false,
        }
    );

export default ActivityLog;