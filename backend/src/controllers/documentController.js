function createDocumentController(service) {
  return {
    upload(req, res) {
      if (!req.file) {
        return res.status(400).json({ error: 'Envie um arquivo no campo "file".' });
      }

      return res.status(201).json(service.createDocument(req.file));
    },
    list(req, res) {
      return res.json(service.listDocuments());
    },
    download(req, res) {
      const document = service.getDocumentForDownload(req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Documento não encontrado.' });
      }

      return res.download(document.filePath, document.metadata.name);
    },
  };
}

module.exports = { createDocumentController };
