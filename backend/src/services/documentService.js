const { randomUUID } = require('node:crypto');

function createDocumentService(repository) {
  function toPublicDocument(document) {
    const { storedName, ...metadata } = document;
    return metadata;
  }

  return {
    createDocument(file) {
      const document = repository.create({
        id: randomUUID(),
        name: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: 'anonymous',
        storedName: file.filename,
      });
      return toPublicDocument(document);
    },
    listDocuments() {
      return repository.findAll().map(toPublicDocument);
    },
    getDocumentForDownload(id) {
      const document = repository.findById(id);
      if (!document) {
        return null;
      }

      return {
        metadata: toPublicDocument(document),
        filePath: repository.getFilePath(document),
      };
    },
  };
}

module.exports = { createDocumentService };
