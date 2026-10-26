function createErrorHandler(multer) {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
          message: tooLarge
            ? 'O arquivo excede o limite permitido.'
            : 'A requisição de upload não é válida.',
        },
      });
    }

    console.error('Erro ao processar requisição do DMS:', error.message);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a requisição.' },
    });
  };
}

module.exports = { createErrorHandler };