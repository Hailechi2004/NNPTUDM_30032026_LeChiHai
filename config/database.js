// config/database.js - SQLite Connection (Sequelize)
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./messaging.db",
  logging: false,
});

module.exports = sequelize;

/**
 * ==================== HƯỚNG DẪN CẤU HÌNH ====================
 *
 * Thay đổi các giá trị sau theo MySQL của bạn:
 *
 * - Database name: 'messaging_db'
 * - Username: 'root'
 * - Password: 'password'
 * - Host: 'localhost'
 * - Port: 3306
 *
 * Ví dụ thay đổi:
 *
 * const sequelize = new Sequelize('my_database', 'my_user', 'my_password', {
 *   host: 'localhost',
 *   port: 3306,
 *   dialect: 'mysql',
 * });
 *
 */
