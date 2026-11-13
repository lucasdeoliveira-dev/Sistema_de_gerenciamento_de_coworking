const { z } = require('zod');
const { LISTA_PERFIS } = require('../../config/perfis');
const { campos, comTipoPessoa } = require('../auth/auth.schemas');

const perfil = z.enum(LISTA_PERFIS, { error: `Perfil deve ser: ${LISTA_PERFIS.join(', ')}` });

const idParams = z.object({ id: z.string().uuid('Identificador inválido') });

const listarQuery = z.object({
  pagina: z.coerce.number({ error: 'pagina deve ser um número' }).int().min(1, 'pagina deve ser 1 ou mais').default(1),
  porPagina: z.coerce
    .number({ error: 'porPagina deve ser um número' })
    .int()
    .min(1, 'porPagina deve ser 1 ou mais')
    .max(100, 'porPagina pode ser no máximo 100')
    .default(20),
  busca: z.string().trim().max(100).optional(),
  perfil: perfil.optional(),
  tipoPessoa: campos.tipoPessoa.optional(),
  ativo: z
    .enum(['true', 'false'], { error: 'Use true ou false' })
    .transform((v) => v === 'true')
    .optional(),
});

const criarSchema = comTipoPessoa({
  nome: campos.nome,
  email: campos.email,
  cpf: campos.cpf,
  telefone: campos.telefone,
  senha: campos.senhaForte,
  perfil: perfil.default('SOLICITANTE'),
});

const atualizarSchema = z
  .object({
    nome: campos.nome.optional(),
    cpf: campos.cpf,
    telefone: campos.telefone,
    perfil: perfil.optional(),
    ativo: z.boolean({ error: 'ativo deve ser true ou false' }).optional(),
    empresa: campos.empresaEditavel.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    error: 'Envie ao menos um campo para atualizar',
  });

const redefinirSenhaSchema = z.object({ novaSenha: campos.senhaForte });

module.exports = { idParams, listarQuery, criarSchema, atualizarSchema, redefinirSenhaSchema };
