// src/models/ProjectMember.js
import "server-only";
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const ProjectMember =
  sequelize.models.ProjectMember || sequelize.define(
    "ProjectMember",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "projects", key: "id" },
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
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
      tableName: "project_members",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["project_id", "user_id"],
        },
        {
          fields: ["user_id"],
        },
      ],
    }
  );

export default ProjectMember;