const documentRepository = require('../repositories/documentRepository');

function toPublicDocument(document) {
  const { id, name, size, uploadedAt, owner } = document;
  return { id, name, size, uploadedAt, owner };
}

function createDocument(file) {
  const document = documentRepository.save({
    id: file.filename,
    name: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'anonymous',
    filePath: file.path,
  });

  return toPublicDocument(document);
}

function listDocuments() {
  return documentRepository.findAll().map(toPublicDocument);
}

function findDocument(id) {
  return documentRepository.findById(id);
}

module.exports = { createDocument, listDocuments, findDocument };
