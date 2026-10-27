const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');
const { rateLimit } = require('express-rate-limit');

function createDocumentRouter({ controller, storageDir }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDir,
      filename(req, file, callback) {
        callback(null, randomUUID());
      },
    }),
  });

  router.post(
    '/upload',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Limite de uploads atingido. Tente novamente mais tarde.' },
    }),
    upload.single('file'),
    controller.upload,
  );
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };
