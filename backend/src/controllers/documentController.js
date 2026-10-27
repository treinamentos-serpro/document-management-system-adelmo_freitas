const path = require('node:path');
const documentService = require('../services/documentService');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documentIdPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'É necessário enviar um arquivo.' });
  }

  const document = documentService.createDocument(req.file);
  return res.status(201).json({ document });
}

function listDocuments(req, res) {
  return res.json({ documents: documentService.listDocuments() });
}

function downloadDocument(req, res) {
  if (!documentIdPattern.test(req.params.id)) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const document = documentService.findDocument(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const filePath = path.resolve(storageDirectory, document.id);
  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(filePath, document.name);
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
