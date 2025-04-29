// src/controllers/documentController.js

const fs = require("fs");
const path = require("path");
const util = require("util");
const crypto = require("crypto");
const multer = require("multer");
const Document = require("../models/Document");

// ——— CONFIG ———
const UPLOAD_TMP = path.join(__dirname, "../uploads/tmp");
const UPLOAD_ENC = path.join(__dirname, "../uploads/enc");
const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, "salt", 32);

// ensure our dirs exist
[UPLOAD_TMP, UPLOAD_ENC].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// promisified pipeline for stream handling
const pipeline = util.promisify(require("stream").pipeline);

// ——— MULTER SETUP ———
const storage = multer.diskStorage({
  destination: UPLOAD_TMP,
  filename: (req, file, cb) => {
    // prepend timestamp to avoid collisions
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// middleware to handle single‐file uploads under field name "file"
exports.uploadMiddleware = upload.single("file");

// ——— UPLOAD & ENCRYPT ———
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received." });
    }

    // 1) generate IV + cipher
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    // 2) file paths
    const tmpPath = req.file.path;
    const encName = req.file.filename + ".enc";
    const encFilePath = path.join(UPLOAD_ENC, encName);

    // 3) encrypt to disk
    await pipeline(
      fs.createReadStream(tmpPath),
      cipher,
      fs.createWriteStream(encFilePath)
    );

    // 4) cleanup tmp file
    fs.unlinkSync(tmpPath);

    // 5) gather metadata
    const { size } = fs.statSync(encFilePath);

    const entry = {
      documentName: req.body.documentName,
      fileURL: `/api/documents/download/${encName}`,
      offlinePath: encFilePath,
      fileSize: size,
      fileType: req.file.mimetype,
      expirationDate: req.body.expirationDate || null,
      isOffline: false,
      iv: iv.toString("hex")
    };

    // 6) save into Mongo
    console.log("////////////////////////", req.user._id);

    const userId = req.user._id;
    let doc = await Document.findOne({ user: userId });
    if (!doc) {
      doc = new Document({ user: userId, document: [] });
    }
    doc.document.push(entry);
    await doc.save();

    return res.status(201).json({ message: "Uploaded & encrypted", entry });
  } catch (err) {
    return next(err);
  }
};

// ——— LIST ALL FOR CURRENT USER ———
exports.getDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const doc = await Document.findOne({ user: userId });
    res.json({ documents: doc ? doc.document : [] });
  } catch (err) {
    next(err);
  }
};

// ——— DOWNLOAD & DECRYPT STREAM ———
exports.downloadDocument = async (req, res, next) => {
  console.log("<><><><><><><><><><>", req);

  try {
    const encName = req.params.filename;
    const userId = req.user._id;

    // Log for debug
    console.log("🔍 Looking for file:", encName, "for user:", userId);

    // Match fileURL using regex on the encrypted filename only
    const doc = await Document.findOne(
      { user: userId, "document.fileURL": { $regex: encName } },
      { "document.$": 1 }
    );

    if (!doc || !doc.document.length) {
      return res.status(404).json({ error: "Not found" });
    }

    const fileMeta = doc.document[0];

    if (!fs.existsSync(fileMeta.offlinePath)) {
      return res.status(404).json({ error: "File missing on server" });
    }

    const iv = Buffer.from(fileMeta.iv, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileMeta.documentName}"`
    );
    res.setHeader("Content-Type", fileMeta.fileType);

    const encStream = fs.createReadStream(fileMeta.offlinePath);
    return encStream.pipe(decipher).pipe(res);
  } catch (err) {
    console.error("❌ Download error:", err.message);
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;

    // 1) load the parent doc
    const parent = await Document.findOne({ user: userId });
    if (!parent) {
      return res.status(404).json({ message: "You have no documents." });
    }

    // 2) find the subdoc
    const entry = parent.document.find((d) => d._id.toString() === entryId);
    if (!entry) {
      return res.status(404).json({ message: "Document not found." });
    }

    // 3) delete the encrypted file
    if (entry.offlinePath && fs.existsSync(entry.offlinePath)) {
      fs.unlinkSync(entry.offlinePath);
    }

    // 4a) remove from the array via pull()
    parent.document.pull(entryId);

    // —or— if pull() doesn’t work for you, use:
    // parent.document = parent.document.filter(d => d._id.toString() !== entryId);

    // 5) persist
    await parent.save();

    return res
      .status(200)
      .json({ message: "Deleted successfully", id: entryId });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};
