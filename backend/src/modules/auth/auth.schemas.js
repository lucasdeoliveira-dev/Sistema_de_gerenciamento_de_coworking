const { z } = require('zod');
const { cpfValido } = require('../../utils/cpf');
const { cnpjValido } = require('../../utils/cnpj');

const nome = z
  .string({ error: 'Nome é obrigatório' })
  .trim()
  .min(2, 'Nome muito curto')
  .max(150, 'Nome deve ter no máximo 150 caracteres');

const email = z
  .string({ error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .max(254, 'E-mail muito longo')
  .email('E-mail inválido');

const cpf = z
  .string()
  .trim()
  .transform((valor) => valor.replace(/\D/g, ''))
  .refine(cpfValido, 'CPF inválido')
  .nullish();

const telefone = z
  .string()
  .trim()
  .regex(/^[0-9()+\-\s]{8,20}$/, 'Telefone inválido')
  .nullish();

const senhaForte = z
  .string({ error: 'Senha é obrigatória' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'A senha deve ter pelo menos uma letra')
  .regex(/[0-9]/, 'A senha deve ter pelo menos um número');

const tipoPessoa = z.enum(['FISICA', 'JURIDICA'], { error: 'Tipo de pessoa deve ser FISICA ou JURIDICA' });

const cnpj = z
  .string({ error: 'CNPJ é obrigatório' })
  .trim()
  .toUpperCase()
  .transform((valor) => valor.replace(/[^0-9A-Z]/g, ''))
  .refine(cnpjValido, 'CNPJ inválido');

const razaoSocial = z
  .string({ error: 'Razão social é obrigatória' })
  .trim()
  .min(2, 'Razão social muito curta')
  .max(150, 'Razão social deve ter no máximo 150 caracteres');

const nomeFantasia = z
  .string()
  .trim()
  .min(2, 'Nome fantasia muito curto')
  .max(150, 'Nome fantasia deve ter no máximo 150 caracteres')
  .nullish();

const empresa = z.object({ cnpj, razaoSocial, nomeFantasia }, { error: 'Dados da empresa inválidos' });

const empresaEditavel = z.object(
  { razaoSocial: razaoSocial.optional(), nomeFantasia },
  { error: 'Dados da empresa inválidos' },
);

const comTipoPessoa = (forma) =>
  z
    .object({ ...forma, tipoPessoa: tipoPessoa.default('FISICA'), empresa: empresa.optional() })
    .refine((d) => d.tipoPessoa === 'FISICA' || d.empresa, {
      error: 'Informe os dados da empresa',
      path: ['empresa'],
      when: ({ issues }) => issues.length === 0,
    })
    .transform((d) => (d.tipoPessoa === 'FISICA' ? { ...d, empresa: undefined } : d));

const registroSchema = comTipoPessoa({ nome, email, cpf, telefone, senha: senhaForte });

const loginSchema = z.object({
  email,
  senha: z.string({ error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória').max(72),
});

const atualizarEuSchema = z
  .object({ nome: nome.optional(), cpf, telefone, empresa: empresaEditavel.optional() })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    error: 'Envie ao menos um campo para atualizar',
  });

const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string({ error: 'Informe a senha atual' }).min(1, 'Informe a senha atual').max(72),
    novaSenha: senhaForte,
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    error: 'A nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  });

const recuperarSenhaSchema = z.object({ email });

const redefinirSenhaSchema = z.object({
  token: z.string({ error: 'Link inválido' }).min(20, 'Link inválido').max(200, 'Link inválido'),
  novaSenha: senhaForte,
});

module.exports = {
  campos: { nome, email, cpf, telefone, senhaForte, tipoPessoa, empresaEditavel },
  comTipoPessoa,
  registroSchema,
  loginSchema,
  atualizarEuSchema,
  trocarSenhaSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
};
