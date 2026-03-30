// app.js - Ví dụ tích hợp router vào Express app
const express = require("express");
const mongoose = require("mongoose");
const messageRouter = require("./routes/messageRouter");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware xác thực (cần cài đặt)
// Thay thế bằng jwt hoặc session authentication của bạn
const authMiddleware = (req, res, next) => {
  // Ví dụ: từ JWT token
  req.user = {
    _id: req.headers["user-id"], // Hoặc từ JWT token
  };
  next();
};

app.use(authMiddleware);

// Routes
app.use("/api/messages", messageRouter);

// Kết nối MongoDB
mongoose
  .connect("mongodb://localhost:27017/messaging_db")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
