
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tasks", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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

      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      assigned_to: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      status: {
        type: Sequelize.ENUM(
          "todo",
          "in_progress",
          "completed"
        ),
        allowNull: false,
        defaultValue: "todo",
      },

      priority: {
        type: Sequelize.ENUM(
          "low",
          "medium",
          "high"
        ),
        allowNull: false,
        defaultValue: "medium",
      },

      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("tasks", ["project_id"]);
    await queryInterface.addIndex("tasks", ["assigned_to"]);
    await queryInterface.addIndex("tasks", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tasks");
  },
};
