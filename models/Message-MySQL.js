// models/Message-MySQL.js - MySQL Version (Sequelize ORM)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    from: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    to: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM("file", "text"),
      allowNull: false,
      defaultValue: "text",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Message;
