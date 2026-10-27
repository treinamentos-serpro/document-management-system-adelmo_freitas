const documentService = require('../services/documentService');

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
  const document = documentService.findDocument(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(document.filePath, document.name);
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
