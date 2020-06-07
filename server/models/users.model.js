const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const UsersSchema = new Schema(
  {
    username: String,
    password: String,
    addedAt: { type: Date, default: Date.now }
  },
  {
    versionKey: false,
    collection: "UsersCollection"
  }
);

UsersSchema.pre("save", function(next) {
  if (this.isModified("password") || this.isNew()) {
    this.password = bcrypt.hashSync(this.password, 12);
  }
  next();
});

module.exports = model("UsersModel", UsersSchema);