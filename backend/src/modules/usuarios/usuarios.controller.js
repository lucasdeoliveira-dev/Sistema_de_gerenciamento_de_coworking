const service = require('./usuarios.service');

async function listar(req, res) {
  res.json(await service.listar(req.validado.query));
}

async function obter(req, res) {
  res.json(await service.obter(req.validado.params.id));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.validado.body, req.ctx));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(req.validado.params.id, req.validado.body, req.ctx));
}

async function redefinirSenha(req, res) {
  await service.redefinirSenha(req.validado.params.id, req.validado.body, req.ctx);
  res.status(204).end();
}

module.exports = { listar, obter, criar, atualizar, redefinirSenha };
