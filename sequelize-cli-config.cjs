require("dotenv").config({ path: ".env.local" });

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wandernest_db",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mariadb",
    logging: false,
  },
};