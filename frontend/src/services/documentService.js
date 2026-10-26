const API_BASE = '/api';

async function request(path, userId, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...options.headers, 'X-User-Id': userId },
  });

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // Mantém a mensagem padrão quando a resposta não contém JSON.
    }
    throw new Error(message);
  }
  return response;
}

export async function listDocuments(userId, signal) {
  return (await request('/documents', userId, { signal })).json();
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return (await request('/upload', userId, { method: 'POST', body: formData })).json();
}

export async function downloadDocument(userId, documentId) {
  return (await request(`/documents/${encodeURIComponent(documentId)}/download`, userId)).blob();
}