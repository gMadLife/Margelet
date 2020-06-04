const { Schema, model } = require("mongoose");

const ChatsSchema = new Schema(
  {
    date: { type: Date },
    title: { type: String },
    description: { type: String },
    admin: { type: String },
    users: { type: Array }
  },
  {
    versionKey: false,
    collection: "ChatsCollection"
  }
);

module.exports = model("ChatsModel", ChatsSchema);
