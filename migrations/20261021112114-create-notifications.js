
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      activity_log_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      project_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      task_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      message: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("notifications", ["user_id"], {
      name: "idx_notifications_user",
    });

    await queryInterface.addIndex("notifications", ["project_id"], {
      name: "idx_notifications_project",
    });

    await queryInterface.addIndex("notifications", ["task_id"], {
      name: "idx_notifications_task",
    });

    await queryInterface.addIndex(
      "notifications",
      ["user_id", "is_read"],
      { name: "idx_notifications_read" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifications");
  },
};
