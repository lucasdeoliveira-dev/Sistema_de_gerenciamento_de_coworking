export const TIPOS_ESPACO = Object.freeze(['COWORKING', 'LABORATORIO', 'SALA']);

export const NOMES_TIPO_ESPACO = Object.freeze({
  COWORKING: 'Coworking',
  LABORATORIO: 'Laboratório',
  SALA: 'Sala',
});

export const DIAS_SEMANA = Object.freeze([
  { valor: 1, rotulo: 'Segunda-feira', sigla: 'Seg' },
  { valor: 2, rotulo: 'Terça-feira', sigla: 'Ter' },
  { valor: 3, rotulo: 'Quarta-feira', sigla: 'Qua' },
  { valor: 4, rotulo: 'Quinta-feira', sigla: 'Qui' },
  { valor: 5, rotulo: 'Sexta-feira', sigla: 'Sex' },
  { valor: 6, rotulo: 'Sábado', sigla: 'Sáb' },
  { valor: 7, rotulo: 'Domingo', sigla: 'Dom' },
]);

export function resumoHorarios(horarios) {
  if (!horarios?.length) return 'Sem horário cadastrado';

  const porDia = new Map();
  for (const faixa of horarios) {
    const texto = `${faixa.hora_inicio}–${faixa.hora_fim}`;
    const lista = porDia.get(faixa.dia_semana) ?? [];
    lista.push(texto);
    porDia.set(faixa.dia_semana, lista);
  }

  return DIAS_SEMANA.filter((dia) => porDia.has(dia.valor))
    .map((dia) => `${dia.sigla} ${porDia.get(dia.valor).join(', ')}`)
    .join(' · ');
}
