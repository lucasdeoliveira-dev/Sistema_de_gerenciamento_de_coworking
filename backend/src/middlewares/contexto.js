const crypto = require('node:crypto');

function contexto(req, res, next) {
  const requisicaoId = crypto.randomUUID();
  res.setHeader('X-Request-Id', requisicaoId);
  req.ctx = {
    requisicaoId,
    ip: req.ip || null,
    userAgent: (req.get('user-agent') || '').slice(0, 500) || null,
    usuarioId: null,
  };
  next();
}

module.exports = contexto;
