const { randomUUID } = require('node:crypto');

function createDocumentService(repository) {
  return {
    async registerUpload(file, owner) {
      const document = {
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storageName: file.filename,
        mimeType: file.mimetype,
      };

      try {
        repository.create(document);
      } catch (error) {
        await repository.removeFile(document.storageName);
        throw error;
      }
      return {
        id: document.id,
        originalName: document.originalName,
        size: document.size,
        uploadedAt: document.uploadedAt,
        owner: document.owner,
      };
    },

    listDocuments(owner) {
      return repository.listByOwner(owner);
    },

    getDownload(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) {
        return null;
      }

      return {
        filePath: repository.getFilePath(document.storageName),
        originalName: document.originalName,
        mimeType: document.mimeType,
      };
    },
  };
}

module.exports = { createDocumentService };