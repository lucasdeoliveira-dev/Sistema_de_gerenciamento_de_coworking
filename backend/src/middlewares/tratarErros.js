const env = require('../config/env');
const AppError = require('../utils/AppError');

const CONSTRAINTS = {
  uq_usuarios_email: [409, 'EMAIL_EM_USO', 'Este e-mail já está cadastrado.'],
  uq_usuarios_cpf: [409, 'CPF_EM_USO', 'Este CPF já está cadastrado.'],
  uq_empresas_cnpj: [
    409,
    'CNPJ_EM_USO',
    'Este CNPJ já está cadastrado. Peça à administração para vincular a sua conta à empresa.',
  ],
};

const CODIGOS = {
  SG001: [422, 'REGRA_DE_NEGOCIO'],
  SG002: [409, 'HISTORICO_IMUTAVEL'],
  SG003: [403, 'ACESSO_NEGADO'],
  23505: [409, 'REGISTRO_DUPLICADO', 'Já existe um registro com esses dados.'],
  23503: [409, 'REFERENCIA_INVALIDA', 'Registro relacionado não existe ou está em uso.'],
  23514: [422, 'REGRA_VIOLADA', 'Os dados não atendem às regras do sistema.'],
  '22P02': [400, 'FORMATO_INVALIDO', 'Formato de dado inválido.'],
};

function responder(res, status, codigo, mensagem, detalhes) {
  res.status(status).json({ erro: { codigo, mensagem, ...(detalhes !== undefined && { detalhes }) } });
}

function rotaNaoEncontrada(req, res) {
  responder(res, 404, 'ROTA_NAO_ENCONTRADA', `Rota ${req.method} ${req.path} não existe.`);
}

function tratarErros(erro, req, res, _next) {
  if (erro instanceof AppError) {
    return responder(res, erro.status, erro.codigo, erro.message, erro.detalhes);
  }

  if (erro.type === 'entity.parse.failed') {
    return responder(res, 400, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.');
  }
  if (erro.type === 'entity.too.large') {
    return responder(res, 413, 'CORPO_GRANDE', 'Requisição muito grande.');
  }

  if (typeof erro.code === 'string') {
    const porConstraint = erro.constraint && CONSTRAINTS[erro.constraint];
    if (porConstraint) return responder(res, ...porConstraint);

    const porCodigo = CODIGOS[erro.code];
    if (porCodigo) {
      const [status, codigo, mensagemPadrao] = porCodigo;
      return responder(res, status, codigo, erro.code.startsWith('SG') ? erro.message : mensagemPadrao);
    }
  }

  console.error('[erro]', erro);
  return responder(res, 500, 'ERRO_INTERNO', 'Erro interno no servidor.', env.emProducao ? undefined : erro.message);
}

module.exports = { tratarErros, rotaNaoEncontrada };
