
import "server-only";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "wandernest_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mariadb",
    logging: false,
  }
);

export default sequelize;
