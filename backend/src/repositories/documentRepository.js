const fs = require('node:fs');
const path = require('node:path');

function createDocumentRepository(storageDir) {
  fs.mkdirSync(storageDir, { recursive: true });
  const documents = new Map();

  return {
    create(document) {
      documents.set(document.id, document);
      return document;
    },
    findAll() {
      return [...documents.values()];
    },
    findById(id) {
      return documents.get(id) || null;
    },
    getFilePath(document) {
      return path.join(storageDir, document.storedName);
    },
  };
}

module.exports = { createDocumentRepository };
