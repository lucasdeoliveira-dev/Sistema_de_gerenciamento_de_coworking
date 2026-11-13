const env = require('../config/env');
const { COOKIE_SESSAO, opcoesCookie } = require('../config/sessao');
const AppError = require('../utils/AppError');
const sessoesRepo = require('../modules/auth/sessoes.repository');

async function autenticar(req, res, next) {
  const token = req.cookies?.[COOKIE_SESSAO];
  if (!token) {
    throw new AppError(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');
  }

  const sessao = await sessoesRepo.buscarAtivaPorToken(token, env.auth.sessaoInatividadeMinutos);
  if (!sessao) {
    res.clearCookie(COOKIE_SESSAO, opcoesCookie());
    throw new AppError(401, 'SESSAO_EXPIRADA', 'Sua sessão expirou. Faça login novamente.');
  }

  if (Date.now() - new Date(sessao.ultimo_acesso_em).getTime() > 60_000) {
    await sessoesRepo.registrarAcesso(sessao.sessao_id);
  }

  req.sessaoId = sessao.sessao_id;
  req.usuario = { id: sessao.usuario_id, nome: sessao.nome, email: sessao.email, perfil: sessao.perfil };
  req.ctx.usuarioId = sessao.usuario_id;
  next();
}

module.exports = autenticar;
