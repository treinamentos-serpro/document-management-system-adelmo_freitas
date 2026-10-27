const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { unlink } = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

let server;
let baseUrl;
let uploadedDocument;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  if (uploadedDocument) {
    const storedFile = path.join(__dirname, '../storage', uploadedDocument.id);
    await unlink(storedFile).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });
  }
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('POST /upload armazena um documento e retorna seus metadados', async () => {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob(['conteúdo do documento'], { type: 'text/plain' }),
    'documento.txt',
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.equal(response.status, 201);
  const { document } = await response.json();
  assert.equal(document.name, 'documento.txt');
  assert.equal(document.size, Buffer.byteLength('conteúdo do documento'));
  assert.ok(document.id);
  uploadedDocument = document;
});

test('POST /upload sem arquivo retorna erro de validação', async () => {
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST' });

  assert.equal(response.status, 400);
});

test('GET /documents lista os documentos enviados', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  const { documents } = await response.json();

  assert.equal(response.status, 200);
  assert.ok(documents.some((document) => document.id === uploadedDocument.id));
});

test('GET /documents/:id/download retorna o arquivo enviado', async () => {
  const response = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'conteúdo do documento');
});

test('GET /documents/:id/download retorna 404 para documento inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/inexistente/download`);

  assert.equal(response.status, 404);
});
