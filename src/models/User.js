
import "server-only";
import { DataTypes } from "sequelize";
import sequelize from "@/lib/sequelize";

const User =
  sequelize.models.User ||
  sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM(
          "admin",
          "project_owner",
          "project_member"
        ),
        allowNull: false,
        defaultValue: "project_member",
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users",
      timestamps: false,
    }
  );

export default User;
