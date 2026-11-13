const { COOKIE_SESSAO, opcoesCookie } = require('../../config/sessao');
const service = require('./auth.service');

async function registrar(req, res) {
  const usuario = await service.registrar(req.validado.body, req.ctx);
  res.status(201).json(usuario);
}

async function login(req, res) {
  const { token, expiraEm, usuario } = await service.login(req.validado.body, req.ctx);
  res.cookie(COOKIE_SESSAO, token, { ...opcoesCookie(), expires: new Date(expiraEm) });
  res.json({ usuario, sessaoExpiraEm: expiraEm });
}

async function logout(req, res) {
  await service.logout(req.cookies?.[COOKIE_SESSAO]);
  res.clearCookie(COOKIE_SESSAO, opcoesCookie());
  res.status(204).end();
}

async function logoutTodos(req, res) {
  await service.logoutTodos(req.usuario.id);
  res.clearCookie(COOKIE_SESSAO, opcoesCookie());
  res.status(204).end();
}

async function eu(req, res) {
  res.json(await service.meuPerfil(req.usuario.id));
}

async function minhasSessoes(req, res) {
  res.json(await service.minhasSessoes(req.usuario.id, req.sessaoId));
}

async function atualizarEu(req, res) {
  res.json(await service.atualizarMeuPerfil(req.usuario.id, req.validado.body, req.ctx));
}

async function trocarSenha(req, res) {
  const { token, expiraEm } = await service.trocarSenha(req.usuario.id, req.validado.body, req.ctx);
  res.cookie(COOKIE_SESSAO, token, { ...opcoesCookie(), expires: new Date(expiraEm) });
  res.status(204).end();
}

async function solicitarRecuperacao(req, res) {
  await service.solicitarRecuperacao(req.validado.body, req.ctx);
  res.status(202).json({
    mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.',
  });
}

async function redefinirSenha(req, res) {
  await service.redefinirSenha(req.validado.body, req.ctx);
  res.clearCookie(COOKIE_SESSAO, opcoesCookie());
  res.status(204).end();
}

module.exports = {
  registrar,
  login,
  logout,
  logoutTodos,
  eu,
  minhasSessoes,
  atualizarEu,
  trocarSenha,
  solicitarRecuperacao,
  redefinirSenha,
};
