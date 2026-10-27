const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

async function startTestServer(t) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = createApp({ storageDir }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  return `http://127.0.0.1:${port}`;
}

test('o app backend é exportado', () => {
  assert.equal(typeof createApp, 'function');
});

test('faz upload, lista e baixa um documento', async (t) => {
  const baseUrl = await startTestServer(t);
  const form = new FormData();
  form.append('file', new Blob(['conteúdo do documento'], { type: 'text/plain' }), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const uploadedDocument = await uploadResponse.json();
  assert.equal(uploadedDocument.name, 'relatorio.txt');
  assert.equal(uploadedDocument.size, Buffer.byteLength('conteúdo do documento'));
  assert.equal(uploadedDocument.owner, 'anonymous');
  assert.match(uploadedDocument.id, /^[\da-f-]{36}$/i);
  assert.ok(Number.isNaN(Date.parse(uploadedDocument.uploadedAt)) === false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [uploadedDocument]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="relatorio\.txt"/);
  assert.equal(await downloadResponse.text(), 'conteúdo do documento');
});

test('retorna erros para upload sem arquivo e download inexistente', async (t) => {
  const baseUrl = await startTestServer(t);
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(uploadResponse.status, 400);

  const downloadResponse = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.equal(downloadResponse.status, 404);
});

test('limita uploads por cliente', async (t) => {
  const baseUrl = await startTestServer(t);

  for (let request = 0; request < 10; request += 1) {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.equal(response.status, 400);
  }

  const limitedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(limitedResponse.status, 429);
});
