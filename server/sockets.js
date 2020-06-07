const ChatsModel = require("./models/chats.model");
const MessagesModel = require("./models/messages.model");
const UploadsModel = require("./models/uploads.model");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const mongoose = require("mongoose");

function auth(socket, next) {
  // Parse cookie
  cookieParser()(socket.request, socket.request.res, () => {});

  // JWT authenticate
  passport.authenticate(
    "jwt",
    { session: false },
    (error, decryptToken, jwtError) => {
      if (!error && !jwtError && decryptToken) {
        next(false, { username: decryptToken.username, id: decryptToken.id });
      } else {
        next("guest");
      }
    }
  )(socket.request, socket.request.res);
}

module.exports = io => {
  io.on("connection", function(socket) {
    auth(socket, (guest, user) => {
      if (!guest) {
        socket.join("all");
        socket.username = user.username;
        socket.emit(
          "connected",
          `you are connected to chat as ${user.username}`
        );
      }
    });
    
    socket.on("getChatList", () => {
      if (!socket.username) return;

      ChatsModel.find({ users: socket.username })
        .sort({ date: 1 })
        .lean()
        .exec((err, chats) => {
          if (!err) {
            socket.emit("chatList", chats);
        }
      });
    });

    socket.on("getChatHistory", (chatId) => {
      if (!socket.username) return;

      ChatsModel.exists({ id: chatId, users: socket.username }, (err, exists) => {
        if (err || !exists) return;

        MessagesModel.find({ chat: chatId })
          .sort({ date: -1 })
          .limit(50)
          .sort({ date: 1 })
          .lean()
          .exec((err, messages) => {
          if (err) return;

          socket.emit("chatHistory", chatId, messages);
        });
      });
    });

    socket.on("submitMessage", (chatId, messageContent, fileContent) => {
      if (!socket.username) return;

      fileId = null;

      if (fileContent != null) {
        // Create the file in uploads
        const file = {
          filename: messageContent,
          data: fileContent,
          _id: mongoose.Types.ObjectId(),
        };
        
        fileId = file._id;

        UploadsModel.create(file, err => {
          if (err) return console.error("UploadsModel", err);
        });
      }

      const obj = {
        date: new Date(),
        content: messageContent,
        username: socket.username,
        chat: chatId,
        file: fileId,
      };

      MessagesModel.create(obj, err => {
        if (err) return console.error("MessagesModel", err);

        socket.emit("message", obj);
        socket.to("all").emit("message", obj);
      });
    });

    socket.on("submitChat", (chatName, chatDescription) => {
      if (!socket.username) return;

      const obj = {
        title: chatName,
        description: chatDescription,
        admin: socket.username,
        users: [socket.username],
      };

      ChatsModel.create(obj, err => {
        if (err) return console.error("ChatsModel", err);

        socket.to("all").emit("chat", obj);
      });
    });
  });
};
