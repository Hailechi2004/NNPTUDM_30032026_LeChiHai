// routes/messageRouter.js - SQLite Version
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const { Op } = require("sequelize");

// Middleware giả định: lấy user hiện tại từ request (đã xác thực)
const authMiddleware = (req, res, next) => {
  req.userId = req.user?.id || req.query.currentUserId;
  next();
};

router.use(authMiddleware);

/**
 * GET /:userID
 * Lấy toàn bộ message:
 * - from: user hiện tại, to: userID
 * - from: userID, to: user hiện tại
 */
router.get("/:userID", async (req, res) => {
  try {
    const { userID } = req.params;
    const currentUserId = req.userId;

    // Kiểm tra userID hợp lệ
    if (!userID || !currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing userID or current user ID",
      });
    }

    // Tìm tất cả message giữa 2 user
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { from: currentUserId, to: userID },
          { from: userID, to: currentUserId },
        ],
      },
      include: [
        {
          model: User,
          as: "fromUser",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "toUser",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Format response
    const formattedMessages = messages.map((msg) => ({
      _id: msg.id,
      from: msg.fromUser,
      to: msg.toUser,
      contentMessage: {
        type: msg.type,
        content: msg.content,
      },
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
});

/**
 * POST /
 * Gửi message:
 * - Nếu có file: type = 'file', content = URL
 * - Nếu là text: type = 'text', content = nội dung
 */
router.post("/", async (req, res) => {
  try {
    const { to, type, content } = req.body;
    const currentUserId = req.userId;

    // Validate input
    if (!to || !type || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: to, type, content",
      });
    }

    if (!["file", "text"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "file" or "text"',
      });
    }

    if (to === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send message to yourself",
      });
    }

    // Tạo message mới
    const newMessage = await Message.create({
      from: currentUserId,
      to: to,
      type: type,
      content: content,
    });

    // Populate thông tin user
    await newMessage.reload({
      include: [
        {
          model: User,
          as: "fromUser",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "toUser",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    // Format response
    const formattedMessage = {
      _id: newMessage.id,
      from: newMessage.fromUser,
      to: newMessage.toUser,
      contentMessage: {
        type: newMessage.type,
        content: newMessage.content,
      },
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: formattedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
});

/**
 * GET /
 * Lấy message cuối cùng của mỗi user mà:
 * - User hiện tại nhắn tin
 * - Hoặc user khác nhắn cho user hiện tại
 */
router.get("/", async (req, res) => {
  try {
    const currentUserId = req.userId;

    // Tìm tất cả conversation khác nhau và lấy message cuối cùng
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [{ from: currentUserId }, { to: currentUserId }],
      },
      include: [
        {
          model: User,
          as: "fromUser",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "toUser",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Group by other user và lấy message mới nhất
    const lastMessagesByUser = {};

    conversations.forEach((msg) => {
      const otherUserId = msg.from === currentUserId ? msg.to : msg.from;

      if (!lastMessagesByUser[otherUserId]) {
        lastMessagesByUser[otherUserId] = msg;
      }
    });

    // Convert object to array
    const lastMessages = Object.values(lastMessagesByUser).map((msg) => ({
      _id: msg.id,
      from: msg.fromUser,
      to: msg.toUser,
      contentMessage: {
        type: msg.type,
        content: msg.content,
      },
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    // Sort by createdAt DESC
    lastMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: lastMessages,
      count: lastMessages.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
});

module.exports = router;
