const path = require('node:path');

function createDocumentsController(service) {
  function requireUser(req, res, next) {
    const owner = req.get('X-User-Id');
    if (!owner || !owner.trim()) {
      return res.status(400).json({
        error: { code: 'USER_ID_REQUIRED', message: 'Informe o usuário no cabeçalho X-User-Id.' },
      });
    }

    req.userId = owner.trim();
    return next();
  }

  return {
    requireUser,

    async upload(req, res, next) {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
        });
      }

      const safeOriginalName = path.basename(path.win32.basename(req.file.originalname));
      try {
        const document = await service.registerUpload(
          { ...req.file, originalname: safeOriginalName },
          req.userId,
        );
        return res.status(201).json(document);
      } catch (error) {
        return next(error);
      }
    },

    list(req, res, next) {
      try {
        return res.json(service.listDocuments(req.userId));
      } catch (error) {
        return next(error);
      }
    },

    download(req, res, next) {
      const download = service.getDownload(req.params.id, req.userId);
      if (!download) {
        return res.status(404).json({
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
        });
      }

      const mimeType = /^[\w.+-]+\/[\w.+-]+$/.test(download.mimeType || '')
        ? download.mimeType
        : 'application/octet-stream';
      res.set('Content-Type', mimeType);
      return res.download(download.filePath, download.originalName, (error) => {
        if (error) {
          if (error.code === 'ENOENT' && !res.headersSent) {
            return res.status(404).json({
              error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
            });
          }
          if (res.headersSent) {
            return res.destroy(error);
          }
          return next(error);
        }
      });
    },
  };
}

module.exports = { createDocumentsController };