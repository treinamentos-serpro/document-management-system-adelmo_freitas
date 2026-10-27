const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { createDocumentsRepository } = require('./repositories/documents.repository');
const { createDocumentsService } = require('./services/documents.service');
const { createDocumentsController } = require('./controllers/documents.controller');
const { createDocumentsRoutes } = require('./routes/documents.routes');
const { createErrorHandler } = require('./middleware/errorHandler');

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function resolveMaxFileSize(configuredValue) {
  if (configuredValue === undefined) {
    return DEFAULT_MAX_FILE_SIZE;
  }

  const value = Number(configuredValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  return value;
}

function createApp(options = {}) {
  const storageDir = options.storageDir || path.resolve(__dirname, '../storage');
  const maxFileSize = resolveMaxFileSize(
    options.maxFileSize ?? process.env.MAX_FILE_SIZE_BYTES,
  );

  fs.mkdirSync(storageDir, { recursive: true });

  const repository = options.repository || createDocumentsRepository(storageDir);
  const service = createDocumentsService(repository);
  const controller = createDocumentsController(service);
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDir,
      filename: (req, file, callback) => callback(null, randomUUID()),
    }),
    limits: {
      fileSize: maxFileSize,
      files: 1,
      fields: 0,
      parts: 2,
    },
  });

  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(createDocumentsRoutes({ controller, upload }));
  app.use(createErrorHandler(multer));

  return app;
}

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

app.createApp = createApp;
module.exports = app;
