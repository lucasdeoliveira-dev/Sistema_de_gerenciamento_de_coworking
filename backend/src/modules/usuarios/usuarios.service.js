const { transacao } = require('../../database/pool');
const AppError = require('../../utils/AppError');
const authService = require('../auth/auth.service');
const usuariosRepo = require('./usuarios.repository');
const empresasRepo = require('../empresas/empresas.repository');

const naoEncontrado = () => new AppError(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');

function listar(filtros) {
  return usuariosRepo.listar(filtros);
}

async function obter(id) {
  const usuario = await usuariosRepo.buscarPorId(id);
  if (!usuario) throw naoEncontrado();
  return usuario;
}

async function obterOuCriarEmpresa(db, empresa) {
  return (await empresasRepo.buscarIdPorCnpj(empresa.cnpj, db)) ?? empresasRepo.criar(db, empresa);
}

async function criar(dados, ctx) {
  const senhaHash = await authService.gerarHashSenha(dados.senha);
  return transacao(ctx, async (db) => {
    const empresaId = dados.empresa ? await obterOuCriarEmpresa(db, dados.empresa) : null;
    return usuariosRepo.criar(db, {
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      telefone: dados.telefone,
      senhaHash,
      perfil: dados.perfil,
      empresaId,
    });
  });
}

async function atualizar(id, dados, ctx) {
  if (id === ctx.usuarioId && (dados.perfil !== undefined || dados.ativo !== undefined)) {
    throw new AppError(
      400,
      'OPERACAO_NA_PROPRIA_CONTA',
      'Você não pode alterar o próprio perfil nem desativar a própria conta.',
    );
  }

  return transacao(ctx, async (db) => {
    const usuario = await usuariosRepo.atualizar(db, id, dados);
    if (!usuario) throw naoEncontrado();
    if (!dados.empresa) return usuario;
    if (!usuario.empresa) throw authService.semEmpresa();

    await empresasRepo.atualizar(db, usuario.empresa.id, dados.empresa);
    return usuariosRepo.buscarPorId(id, db);
  });
}

async function redefinirSenha(id, { novaSenha }, ctx) {
  const senhaHash = await authService.gerarHashSenha(novaSenha);
  const alterou = await transacao(ctx, (db) => usuariosRepo.atualizarSenha(db, id, senhaHash));
  if (!alterou) throw naoEncontrado();
}

module.exports = { listar, obter, criar, atualizar, redefinirSenha };
