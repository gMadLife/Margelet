const { Schema, model } = require("mongoose");

const ChatsSchema = new Schema(
  {
    date: Date,
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
