export default function DownloadButton({ document, downloading, onDownload }) {
  return (
    <button
      className="button button-quiet"
      type="button"
      aria-label={`Baixar ${document.originalName}`}
      onClick={() => onDownload(document)}
      disabled={downloading}
    >
      {downloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}