const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const mongoose = require("mongoose");

/**
 * GET /:userID
 * Lấy toàn bộ message:
 * - from: user hiện tại, to: userID
 * - from: userID, to: user hiện tại
 */
router.get("/:userID", async (req, res) => {
  try {
    let { userID } = req.params;
    let currentUserId = req.headers["user-id"] || req.query.currentUserId;

    // Convert to ObjectId
    if (currentUserId) {
      currentUserId = new mongoose.Types.ObjectId(currentUserId);
    }
    if (userID) {
      userID = new mongoose.Types.ObjectId(userID);
    }

    // Kiểm tra userID hợp lệ
    if (!userID || !currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing userID or current user ID",
      });
    }

    // Tìm tất cả message giữa 2 user
    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: userID },
        { from: userID, to: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("from", "name email")
      .populate("to", "name email");

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
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
    let { to, type, content } = req.body;
    let currentUserId = req.headers["user-id"] || req.query.currentUserId;

    console.log("DEBUG - Headers:", req.headers);
    console.log("DEBUG - currentUserId before convert:", currentUserId);
    console.log("DEBUG - to before convert:", to);

    // Convert to ObjectId
    if (currentUserId) {
      currentUserId = new mongoose.Types.ObjectId(currentUserId);
      console.log("DEBUG - currentUserId after convert:", currentUserId);
    }
    if (to) {
      to = new mongoose.Types.ObjectId(to);
      console.log("DEBUG - to after convert:", to);
    }

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
    console.log(
      "DEBUG - Creating message with from:",
      currentUserId,
      "to:",
      to,
    );
    const newMessage = new Message({
      from: currentUserId,
      to: to,
      contentMessage: {
        type: type,
        content: content,
      },
    });

    await newMessage.save();

    // Populate thông tin user
    await newMessage.populate("from", "name email");
    await newMessage.populate("to", "name email");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
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
    let currentUserId = req.headers["user-id"] || req.query.currentUserId;

    // Convert to ObjectId
    if (currentUserId) {
      currentUserId = new mongoose.Types.ObjectId(currentUserId);
    }

    // Tìm tất cả các conversation khác nhau
    // Lấy message cuối cùng từ mỗi user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$from", currentUserId] }, "$to", "$from"],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "$from",
          foreignField: "_id",
          as: "fromUser",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "$to",
          foreignField: "_id",
          as: "toUser",
        },
      },
      {
        $addFields: {
          from: { $arrayElemAt: ["$fromUser", 0] },
          to: { $arrayElemAt: ["$toUser", 0] },
        },
      },
      {
        $project: {
          fromUser: 0,
          toUser: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length,
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
