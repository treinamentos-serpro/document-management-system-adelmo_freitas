const express = require('express');
const path = require('node:path');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRouter } = require('./routes/documentRoutes');

function createApp({ storageDir = path.join(__dirname, '../storage') } = {}) {
  const app = express();
  const repository = createDocumentRepository(storageDir);
  const service = createDocumentService(repository);
  const controller = createDocumentController(service);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRouter({ controller, storageDir }));
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const status = error.code === 'LIMIT_FILE_SIZE'
      ? 413
      : error.name === 'MulterError' || error.status
        ? error.status || 400
        : 500;
    res.status(status).json({ error: 'Não foi possível processar a solicitação.' });
  });

  return app;
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
