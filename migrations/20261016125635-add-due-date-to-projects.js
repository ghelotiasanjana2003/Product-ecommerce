"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("projects", "due_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("projects", "due_date");
  },
};