const AppError = require('../utils/AppError');

function autorizar(...perfisPermitidos) {
  if (perfisPermitidos.length === 0) {
    throw new Error('autorizar() precisa de pelo menos um perfil');
  }

  return (req, res, next) => {
    if (!req.usuario) {
      throw new AppError(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');
    }
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      throw new AppError(403, 'ACESSO_NEGADO', 'Você não tem permissão para esta ação.');
    }
    next();
  };
}

module.exports = autorizar;
