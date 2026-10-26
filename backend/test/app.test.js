const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

async function startServer(application) {
  const server = application.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  };
}

async function createTestContext(t, options = {}) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const application = app.createApp({ storageDir, ...options });
  const { server, baseUrl } = await startServer(application);

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  return { baseUrl, storageDir };
}

function makeUpload(name, content, type = 'text/plain') {
  const body = new FormData();
  body.append('file', new Blob([content], { type }), name);
  return body;
}

test('envia, lista e baixa documento apenas para o usuário proprietário', async (t) => {
  const { baseUrl, storageDir } = await createTestContext(t);
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: makeUpload('relatorio.txt', 'conteudo do documento'),
  });

  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, Buffer.byteLength('conteudo do documento'));
  assert.equal(document.owner, 'ana');
  assert.ok(document.uploadedAt);
  assert.equal(Object.hasOwn(document, 'storageName'), false);

  const storedFiles = await fs.readdir(storageDir);
  assert.equal(storedFiles.length, 1);
  assert.notEqual(storedFiles[0], 'relatorio.txt');

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'ana' },
  });
  assert.deepEqual(await listResponse.json(), [document]);

  const otherUserList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bia' },
  });
  assert.deepEqual(await otherUserList.json(), []);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'ana' } },
  );
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
  assert.equal(await downloadResponse.text(), 'conteudo do documento');

  const forbiddenDownload = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'bia' } },
  );
  assert.equal(forbiddenDownload.status, 404);
});

test('valida usuário e arquivo obrigatórios', async (t) => {
  const { baseUrl } = await createTestContext(t);
  const missingUserResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(missingUserResponse.status, 400);

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: new FormData(),
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');
});

test('rejeita arquivo acima do limite configurado', async (t) => {
  const { baseUrl, storageDir } = await createTestContext(t, { maxFileSize: 4 });
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: makeUpload('grande.txt', '12345'),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
  assert.deepEqual(await fs.readdir(storageDir), []);
});

test('remove o arquivo quando não consegue registrar os metadados', async (t) => {
  const repository = {
    create() {
      throw new Error('falha simulada no repositório');
    },
    async removeFile(storageName) {
      await fs.unlink(path.join(storageDir, storageName));
    },
  };
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const application = app.createApp({ storageDir, repository });
  const { server, baseUrl } = await startServer(application);
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: makeUpload('documento.txt', 'conteudo'),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await fs.readdir(storageDir), []);
});
