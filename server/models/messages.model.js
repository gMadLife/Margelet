const { Schema, model } = require("mongoose");

const MessageSchema = new Schema(
  {
    date: Date,
    content: String,
    username: String,
    chat: Schema.Types.ObjectId,
    file: Schema.Types.ObjectId,
  },
  {
    versionKey: false,
    collection: "MessageCollection"
  }
);

module.exports = model("MessageModel", MessageSchema);
