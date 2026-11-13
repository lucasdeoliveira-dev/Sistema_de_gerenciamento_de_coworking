const service = require('./espacos.service');

async function listar(req, res) {
  res.json(await service.listar(req.validado.query, req.usuario.perfil));
}

async function obter(req, res) {
  res.json(await service.obter(req.validado.params.id, req.usuario.perfil));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.validado.body, req.ctx));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(req.validado.params.id, req.validado.body, req.ctx));
}

module.exports = { listar, obter, criar, atualizar };
