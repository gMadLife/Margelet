const { Schema, model } = require("mongoose");

const ChatsSchema = new Schema(
  {
    title: String,
    description: String,
    admin: String,
    users: [String],
  },
  {
    versionKey: false,
    collection: "ChatsCollection"
  }
);

module.exports = model("ChatsModel", ChatsSchema);
