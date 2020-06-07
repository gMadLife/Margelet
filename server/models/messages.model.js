const { Schema, model } = require("mongoose");

const MessageSchema = new Schema(
  {
    date: { type: Date },
    content: { type: String },
    username: { type: String },
    chat: { type: String },
    file: { type: Schema.Types.ObjectId },
  },
  {
    versionKey: false,
    collection: "MessageCollection"
  }
);

module.exports = model("MessageModel", MessageSchema);
