import { useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadForm({ disabled, uploading, onUpload }) {
  const [file, setFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || disabled || uploading) return;
    const form = event.currentTarget;
    const uploaded = await onUpload(file);
    if (uploaded) setFile(null);
    form.reset();
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${disabled ? ' is-disabled' : ''}`}>
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          disabled={disabled || uploading}
        />
        <span className="file-picker-icon" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Selecionar documento'}</strong>
          <small>{file ? formatFileSize(file.size) : 'Qualquer formato'}</small>
        </span>
        <span className="file-picker-action">Escolher arquivo</span>
      </label>
      <button className="button button-primary" type="submit" disabled={!file || disabled || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}