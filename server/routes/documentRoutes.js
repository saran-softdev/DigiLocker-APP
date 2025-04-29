// src/routes/documentRoutes.js
const express = require("express");
const router = express.Router();
const {
  uploadMiddleware,
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument
} = require("../controller/documentController");
const { ensureAuth } = require("../middleware/auth");

router.post("/upload", ensureAuth, uploadMiddleware, uploadDocument);

router.get("/", ensureAuth, getDocuments);

router.get("/download/:filename", ensureAuth, downloadDocument);
router.delete("/:id", ensureAuth, deleteDocument);

module.exports = router;
