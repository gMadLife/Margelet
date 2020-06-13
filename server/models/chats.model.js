const { Schema, model } = require("mongoose");

const ChatsSchema = new Schema(
  {
    title: String,
    description: String,
    admin: String,
    users: [String],
    status: Number,
  },
  {
    versionKey: false,
    collection: "ChatsCollection"
  }
);

module.exports = model("ChatsModel", ChatsSchema);
