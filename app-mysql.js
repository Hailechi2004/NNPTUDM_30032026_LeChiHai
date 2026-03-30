// app-mysql.js - Express Server với MySQL (Sequelize ORM)
const express = require("express");
const sequelize = require("./config/database");
const Message = require("./models/Message-MySQL");
const User = require("./models/User-MySQL");
const messageRouter = require("./routes/messageRouter-MySQL");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware xác thực (cần cài đặt)
const authMiddleware = (req, res, next) => {
  req.user = {
    id: req.headers["user-id"], // Hoặc từ JWT token
  };
  next();
};

app.use(authMiddleware);

// Routes
app.use("/api/messages", messageRouter);

// Khởi tạo database relationships
User.hasMany(Message, { foreignKey: "from", as: "sentMessages" });
User.hasMany(Message, { foreignKey: "to", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "from", as: "fromUser" });
Message.belongsTo(User, { foreignKey: "to", as: "toUser" });

// Kết nối MySQL & Sync Database
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connected to MySQL");
    // Sync models (createIfNotExists)
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log("✅ Database synchronized");
    // Seed test users
    const users = await User.findAll();
    if (users.length === 0) {
      await User.bulkCreate([
        { id: 1, name: "Lê Chi Hải", email: "lechihai@email.com" },
        { id: 2, name: "Nguyễn Văn A", email: "nguyenvana@email.com" },
        { id: 3, name: "Trần Thị B", email: "tranthib@email.com" },
      ]);
      console.log("✅ Test users created");
    }
  })
  .catch((err) => {
    console.error("❌ Connection error:", err);
  });

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
