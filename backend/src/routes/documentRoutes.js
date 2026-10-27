const crypto = require('node:crypto');
const path = require('node:path');
const multer = require('multer');
const express = require('express');
const documentController = require('../controllers/documentController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../storage'),
  filename: (req, file, callback) => callback(null, crypto.randomUUID()),
});
const upload = multer({ storage });
const router = express.Router();

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
