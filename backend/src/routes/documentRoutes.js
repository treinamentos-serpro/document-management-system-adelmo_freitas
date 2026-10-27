const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');

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

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };
