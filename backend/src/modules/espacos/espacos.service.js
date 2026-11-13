const { transacao } = require('../../database/pool');
const { GESTAO } = require('../../config/perfis');
const AppError = require('../../utils/AppError');
const espacosRepo = require('./espacos.repository');

const naoEncontrado = () => new AppError(404, 'ESPACO_NAO_ENCONTRADO', 'Espaço não encontrado.');

function listar(filtros, perfil) {
  const consulta = GESTAO.includes(perfil) ? filtros : { ...filtros, ativo: true };
  return espacosRepo.listar(consulta);
}

async function obter(id, perfil) {
  const espaco = await espacosRepo.buscarPorId(id);
  if (!espaco || (!GESTAO.includes(perfil) && !espaco.ativo)) throw naoEncontrado();
  return espaco;
}

async function criar(dados, ctx) {
  return transacao(ctx, async (db) => {
    const id = await espacosRepo.criar(db, dados);
    await espacosRepo.substituirHorarios(db, id, dados.horarios);
    return espacosRepo.buscarPorId(id, db);
  });
}

async function atualizar(id, dados, ctx) {
  return transacao(ctx, async (db) => {
    const espaco = await espacosRepo.atualizar(db, id, dados);
    if (!espaco) throw naoEncontrado();
    if (!dados.horarios) return espaco;

    await espacosRepo.substituirHorarios(db, id, dados.horarios);
    return espacosRepo.buscarPorId(id, db);
  });
}

module.exports = { listar, obter, criar, atualizar };
