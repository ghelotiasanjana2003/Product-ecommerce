// src/models/Project.js
import "server-only";
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const Project = sequelize.models.Project || sequelize.define(
    "Project",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 150],
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        owner_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "projects",
        timestamps: false,
    }
);

export default Project;