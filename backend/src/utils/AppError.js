class AppError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

module.exports = AppError;
