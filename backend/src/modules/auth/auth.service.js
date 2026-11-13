const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const { transacao, definirUsuarioDaTransacao } = require('../../database/pool');
const AppError = require('../../utils/AppError');
const { gerarToken } = require('../../utils/tokens');
const { enviarRecuperacaoSenha } = require('../../utils/email');
const usuariosRepo = require('../usuarios/usuarios.repository');
const empresasRepo = require('../empresas/empresas.repository');
const sessoesRepo = require('./sessoes.repository');
const tentativasRepo = require('./tentativas.repository');
const recuperacaoRepo = require('./recuperacao.repository');

const credenciaisInvalidas = () => new AppError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');

const semEmpresa = () => new AppError(400, 'SEM_EMPRESA', 'Esta conta é de pessoa física e não tem empresa vinculada.');

let hashFalso;
async function obterHashFalso() {
  hashFalso ??= await bcrypt.hash(crypto.randomUUID(), env.auth.bcryptCusto);
  return hashFalso;
}

function gerarHashSenha(senha) {
  return bcrypt.hash(senha, env.auth.bcryptCusto);
}

async function abrirSessao(db, usuarioId, ctx) {
  const token = gerarToken();
  const sessao = await sessoesRepo.criar(db, {
    usuarioId,
    token,
    horas: env.auth.sessaoDuracaoHoras,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return { token, expiraEm: sessao.expira_em };
}

async function registrar(dados, ctx) {
  if (!env.auth.permitirCadastroPublico) {
    throw new AppError(403, 'CADASTRO_DESABILITADO', 'O cadastro público está desabilitado.');
  }

  const senhaHash = await gerarHashSenha(dados.senha);

  return transacao(ctx, async (db) => {
    const empresaId = dados.empresa ? await empresasRepo.criar(db, dados.empresa) : null;
    return usuariosRepo.criar(db, {
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      telefone: dados.telefone,
      senhaHash,
      perfil: 'SOLICITANTE',
      empresaId,
    });
  });
}

async function login({ email, senha }, ctx) {
  const registrarFalha = (motivo) => tentativasRepo.registrar({ email, ip: ctx.ip, sucesso: false, motivo });

  if ((await tentativasRepo.emailBloqueado(email)) || (await tentativasRepo.ipBloqueado(ctx.ip))) {
    await registrarFalha('BLOQUEADO');
    throw new AppError(429, 'LOGIN_BLOQUEADO', 'Muitas tentativas incorretas. Aguarde 15 minutos e tente novamente.');
  }

  const usuario = await usuariosRepo.buscarParaLogin(email);

  if (!usuario) {
    await bcrypt.compare(senha, await obterHashFalso());
    await registrarFalha('USUARIO_INEXISTENTE');
    throw credenciaisInvalidas();
  }

  if (!(await bcrypt.compare(senha, usuario.senha_hash))) {
    await registrarFalha('SENHA_INVALIDA');
    throw credenciaisInvalidas();
  }

  if (!usuario.ativo) {
    await registrarFalha('USUARIO_INATIVO');
    throw new AppError(403, 'CONTA_DESATIVADA', 'Sua conta está desativada. Procure a administração.');
  }

  const sessao = await transacao({ ...ctx, usuarioId: usuario.id }, async (db) => {
    const novaSessao = await abrirSessao(db, usuario.id, ctx);
    await usuariosRepo.registrarLogin(db, usuario.id);
    await tentativasRepo.registrar({ email, ip: ctx.ip, sucesso: true }, db);
    return novaSessao;
  });

  return { ...sessao, usuario: await usuariosRepo.buscarPorId(usuario.id) };
}

async function logout(token) {
  if (token) await sessoesRepo.revogarPorToken(token);
}

async function logoutTodos(usuarioId) {
  return sessoesRepo.revogarTodasDoUsuario(usuarioId);
}

async function meuPerfil(usuarioId) {
  const usuario = await usuariosRepo.buscarPorId(usuarioId);
  if (!usuario) throw new AppError(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
  return usuario;
}

async function minhasSessoes(usuarioId, sessaoAtualId) {
  const sessoes = await sessoesRepo.listarAtivasDoUsuario(usuarioId);
  return sessoes.map((s) => ({ ...s, atual: s.id === sessaoAtualId }));
}

async function atualizarMeuPerfil(usuarioId, { nome, cpf, telefone, empresa }, ctx) {
  return transacao(ctx, async (db) => {
    const usuario = await usuariosRepo.atualizar(db, usuarioId, { nome, cpf, telefone });
    if (!empresa) return usuario;
    if (!usuario.empresa) throw semEmpresa();

    await empresasRepo.atualizar(db, usuario.empresa.id, empresa);
    return usuariosRepo.buscarPorId(usuarioId, db);
  });
}

async function trocarSenha(usuarioId, { senhaAtual, novaSenha }, ctx) {
  const hashAtual = await usuariosRepo.buscarSenhaHash(usuarioId);
  if (!hashAtual || !(await bcrypt.compare(senhaAtual, hashAtual))) {
    throw new AppError(400, 'SENHA_ATUAL_INCORRETA', 'A senha atual está incorreta.');
  }

  const novoHash = await gerarHashSenha(novaSenha);
  return transacao(ctx, async (db) => {
    await usuariosRepo.atualizarSenha(db, usuarioId, novoHash);
    return abrirSessao(db, usuarioId, ctx);
  });
}

async function solicitarRecuperacao({ email }, ctx) {
  const usuario = await usuariosRepo.buscarResumoPorEmail(email);
  if (!usuario || !usuario.ativo || (await recuperacaoRepo.pedidoRecente(usuario.id))) {
    return;
  }

  const token = gerarToken();
  const minutos = env.auth.recuperacaoMinutos;
  await transacao({ ...ctx, usuarioId: usuario.id }, (db) =>
    recuperacaoRepo.criar(db, { usuarioId: usuario.id, token, minutos, ip: ctx.ip }),
  );

  await enviarRecuperacaoSenha({ para: email, nome: usuario.nome, token, minutos });
}

async function redefinirSenha({ token, novaSenha }, ctx) {
  const novoHash = await gerarHashSenha(novaSenha);

  await transacao(ctx, async (db) => {
    const registro = await recuperacaoRepo.buscarParaUso(db, token);

    const valido = registro && !registro.usado_em && registro.ativo && new Date(registro.expira_em) > new Date();
    if (!valido) {
      throw new AppError(400, 'LINK_INVALIDO', 'Este link é inválido ou expirou. Solicite um novo.');
    }

    await definirUsuarioDaTransacao(db, registro.usuario_id);
    await usuariosRepo.atualizarSenha(db, registro.usuario_id, novoHash);
    await recuperacaoRepo.marcarUsado(db, registro.id);
  });
}

module.exports = {
  gerarHashSenha,
  semEmpresa,
  registrar,
  login,
  logout,
  logoutTodos,
  meuPerfil,
  minhasSessoes,
  atualizarMeuPerfil,
  trocarSenha,
  solicitarRecuperacao,
  redefinirSenha,
};
