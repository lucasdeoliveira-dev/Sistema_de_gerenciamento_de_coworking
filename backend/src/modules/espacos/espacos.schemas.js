const { z } = require('zod');

const TIPOS = ['COWORKING', 'LABORATORIO', 'SALA'];

const tipo = z.enum(TIPOS, { error: `Tipo deve ser: ${TIPOS.join(', ')}` });

const capacidade = z
  .number({ error: 'Informe a capacidade' })
  .int({ error: 'A capacidade deve ser um número inteiro' })
  .min(1, 'A capacidade deve ser pelo menos 1')
  .max(500, 'A capacidade pode ser no máximo 500');

const nome = z.string({ error: 'Nome é obrigatório' }).trim().min(2, 'Nome muito curto').max(120, 'Nome muito longo');

const hora = z.string({ error: 'Horário inválido' }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');

const horarioSchema = z
  .object({
    diaSemana: z
      .number({ error: 'Dia da semana inválido' })
      .int({ error: 'Dia da semana inválido' })
      .min(1, 'Dia da semana vai de 1 (segunda) a 7 (domingo)')
      .max(7, 'Dia da semana vai de 1 (segunda) a 7 (domingo)'),
    horaInicio: hora,
    horaFim: hora,
  })
  .refine((faixa) => faixa.horaFim > faixa.horaInicio, {
    error: 'O fim precisa ser depois do início',
    path: ['horaFim'],
  });

function semSobreposicao(horarios) {
  const ordenados = [...horarios].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
  for (let i = 1; i < ordenados.length; i += 1) {
    const anterior = ordenados[i - 1];
    const atual = ordenados[i];
    if (anterior.diaSemana === atual.diaSemana && anterior.horaFim > atual.horaInicio) return false;
  }
  return true;
}

const horariosSchema = z
  .array(horarioSchema)
  .min(1, 'Informe ao menos um horário de funcionamento')
  .max(21, 'No máximo 21 horários')
  .refine(semSobreposicao, { error: 'Há horários sobrepostos no mesmo dia.' });

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
  tipo: tipo.optional(),
  ativo: z
    .enum(['true', 'false'], { error: 'Use true ou false' })
    .transform((v) => v === 'true')
    .optional(),
});

const criarSchema = z.object({
  nome,
  tipo,
  capacidade,
  horarios: horariosSchema,
});

const atualizarSchema = z
  .object({
    nome: nome.optional(),
    tipo: tipo.optional(),
    capacidade: capacidade.optional(),
    ativo: z.boolean({ error: 'ativo deve ser true ou false' }).optional(),
    horarios: horariosSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    error: 'Envie ao menos um campo para atualizar',
  });

module.exports = { idParams, listarQuery, criarSchema, atualizarSchema };
