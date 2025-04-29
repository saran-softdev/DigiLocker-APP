const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    document: [
      {
        documentName: { type: String, required: true },
        fileURL: { type: String, required: true },
        offlinePath: { type: String }, // <-- new
        fileSize: { type: String },
        fileType: { type: String },
        expirationDate: { type: Date },
        isOffline: { type: Boolean, default: false },
        notified: { type: Boolean, default: false },
        iv: String
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Document || mongoose.model("Document", DocumentSchema);
