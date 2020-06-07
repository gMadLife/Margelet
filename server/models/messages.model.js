const { Schema, model } = require("mongoose");

const MessageSchema = new Schema(
  {
    date: Date,
    content: String,
    username: String,
    chat: String,
    file: Schema.Types.ObjectId,
  },
  {
    versionKey: false,
    collection: "MessageCollection"
  }
);

module.exports = model("MessageModel", MessageSchema);
