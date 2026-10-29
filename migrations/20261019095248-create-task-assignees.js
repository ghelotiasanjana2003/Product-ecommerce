"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("task_assignees", {
      task_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("task_assignees");
  },
};