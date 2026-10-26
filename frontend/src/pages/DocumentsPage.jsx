import { useEffect, useState } from 'react';
import DocumentList from '../components/DocumentList.jsx';
import UploadForm from '../components/UploadForm.jsx';
import { downloadDocument, listDocuments, uploadDocument } from '../services/documentService.js';

const USER_STORAGE_KEY = 'dms-user-id';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [ownerId, setOwnerId] = useState(() => localStorage.getItem(USER_STORAGE_KEY) || '');
  const [userDraft, setUserDraft] = useState(ownerId);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!ownerId) {
      setDocuments([]);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(ownerId, controller.signal)
      .then(setDocuments)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ownerId, refreshToken]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextOwnerId = userDraft.trim();
    if (!nextOwnerId) {
      setError('Informe um identificador de usuário.');
      return;
    }
    localStorage.setItem(USER_STORAGE_KEY, nextOwnerId);
    setError('');
    setNotice('');
    if (nextOwnerId === ownerId) setRefreshToken((token) => token + 1);
    setOwnerId(nextOwnerId);
  }

  async function handleUpload(file) {
    setUploading(true);
    setError('');
    setNotice('');
    try {
      await uploadDocument(ownerId, file);
      setNotice('Documento enviado.');
      setRefreshToken((token) => token + 1);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setError('');
    try {
      const blob = await downloadDocument(ownerId, document.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId('');
    }
  }

  const totalSize = documents.reduce((sum, document) => sum + document.size, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#documentos" aria-label="DMS, documentos"><span className="brand-mark">D</span><span className="brand-name">arquivo<span>/</span>dms</span></a>
        <div className="sidebar-label">ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação principal">
          <a className="nav-link is-active" href="#documentos"><span className="nav-indicator" aria-hidden="true" />Documentos<span className="nav-count">{documents.length}</span></a>
        </nav>
        <div className="sidebar-bottom"><span className="storage-dot" aria-hidden="true" /><div><strong>Armazenamento local</strong><small>Filesystem da aplicação</small></div></div>
      </aside>

      <main id="documentos" className="main-content">
        <header className="topbar">
          <span className="breadcrumb">DMS <span>/</span> Documentos</span>
          <form className="user-form" onSubmit={handleUserSubmit}>
            <label htmlFor="user-id">Usuário</label>
            <input id="user-id" value={userDraft} onChange={(event) => setUserDraft(event.target.value)} placeholder="Identificador" maxLength={128} autoComplete="username" />
            <button className="button button-dark" type="submit">Acessar</button>
          </form>
        </header>

        <div className="content-wrap">
          <section className="page-heading"><div><div className="eyebrow">ARQUIVO DIGITAL</div><h1>Documentos</h1></div><div className="heading-meta"><span className="live-dot" />DISCO LOCAL</div></section>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          <section className="upload-section" aria-labelledby="upload-title">
            <div className="section-heading"><div><span className="section-index">01</span><h2 id="upload-title">Adicionar documento</h2></div><span className="section-note">ENVIO LOCAL</span></div>
            <UploadForm disabled={!ownerId} uploading={uploading} onUpload={handleUpload} />
            {!ownerId && <p className="field-note">Informe um usuário para habilitar o envio.</p>}
          </section>
          <section className="documents-section" aria-labelledby="list-title">
            <div className="section-heading list-heading">
              <div><span className="section-index">02</span><h2 id="list-title">Seus documentos</h2></div>
              <div className="list-summary"><span>{documents.length} {documents.length === 1 ? 'ARQUIVO' : 'ARQUIVOS'}</span><span className="summary-divider" /><span>{formatFileSize(totalSize)} NO TOTAL</span></div>
            </div>
            <DocumentList documents={documents} loading={loading} ownerId={ownerId} downloadingId={downloadingId} onDownload={handleDownload} />
          </section>
          <footer className="page-footer"><span>METADADOS EM MEMÓRIA</span><span>{ownerId ? `SESSÃO ${ownerId}` : 'NENHUM USUÁRIO ATIVO'}</span></footer>
        </div>
      </main>
    </div>
  );
}