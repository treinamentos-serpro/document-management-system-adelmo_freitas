function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(value));
}

export default function DocumentList({ documents, loading, ownerId, downloadingId, onDownload }) {
  if (loading) return <div className="table-state" role="status">Carregando documentos...</div>;
  if (!ownerId) return <div className="table-state">Nenhum usuário selecionado.</div>;
  if (documents.length === 0) return <div className="table-state">Nenhum documento encontrado.</div>;

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th scope="col">Nome</th><th scope="col">Tamanho</th><th scope="col">Enviado em</th><th scope="col"><span className="sr-only">Ações</span></th></tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td><div className="document-name"><span className="file-type" aria-hidden="true">DOC</span><span title={document.originalName}>{document.originalName}</span></div></td>
              <td className="muted-cell">{formatFileSize(document.size)}</td>
              <td className="muted-cell">{formatDate(document.uploadedAt)}</td>
              <td className="action-cell">
                <button className="button button-quiet" type="button" onClick={() => onDownload(document)} disabled={downloadingId === document.id}>
                  {downloadingId === document.id ? 'Baixando...' : 'Baixar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}