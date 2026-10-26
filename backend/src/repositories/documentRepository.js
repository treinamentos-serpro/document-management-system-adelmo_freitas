const path = require('node:path');
const fs = require('node:fs/promises');

function createDocumentRepository(storageDir) {
  const documents = new Map();

  return {
    create(document) {
      documents.set(document.id, { ...document });
      return { ...document };
    },

    listByOwner(owner) {
      return [...documents.values()]
        .filter((document) => document.owner === owner)
        .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
        .map(({ id, originalName, size, uploadedAt, owner: documentOwner }) => ({
          id,
          originalName,
          size,
          uploadedAt,
          owner: documentOwner,
        }));
    },

    findById(id) {
      const document = documents.get(id);
      return document ? { ...document } : null;
    },

    getFilePath(storageName) {
      return path.join(storageDir, storageName);
    },

    async removeFile(storageName) {
      try {
        await fs.unlink(path.join(storageDir, storageName));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },
  };
}

module.exports = { createDocumentRepository };