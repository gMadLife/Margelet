const { Schema, model } = require("mongoose");

const UploadsSchema = new Schema(
  {
	filename: String,
	data: Buffer,
  },
  {
    versionKey: false,
    collection: "UploadsCollection"
  }
);

module.exports = model("UploadsModel", UploadsSchema);
