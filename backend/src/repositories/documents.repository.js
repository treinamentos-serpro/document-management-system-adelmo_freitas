const path = require('node:path');
const fs = require('node:fs/promises');

function createDocumentsRepository(storageDir) {
  const documents = new Map();
  const resolvedStorageDir = path.resolve(storageDir);

  function resolveStoragePath(storageName) {
    if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(storageName)) {
      throw new Error('Nome físico de arquivo inválido.');
    }

    const filePath = path.resolve(resolvedStorageDir, storageName);
    if (path.dirname(filePath) !== resolvedStorageDir) {
      throw new Error('Caminho de arquivo fora do armazenamento permitido.');
    }
    return filePath;
  }

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
      return resolveStoragePath(storageName);
    },

    async removeFile(storageName) {
      try {
        await fs.unlink(resolveStoragePath(storageName));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },
  };
}

module.exports = { createDocumentsRepository };