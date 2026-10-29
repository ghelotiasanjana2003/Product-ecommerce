
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("projects", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      owner_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addIndex("projects", ["owner_id"], {
      name: "idx_projects_owner",
    });

    await queryInterface.createTable("project_members", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addIndex(
      "project_members",
      ["project_id", "user_id"],
      {
        unique: true,
        name: "uq_project_user",
      }
    );

    await queryInterface.addIndex("project_members", ["user_id"], {
      name: "idx_project_members_user",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("project_members");
    await queryInterface.dropTable("projects");
  },
};
