export const PERFIS = Object.freeze({
  ADMIN: 'ADMIN',
  GESTOR: 'GESTOR',
  RECEPCAO: 'RECEPCAO',
  SOLICITANTE: 'SOLICITANTE',
});

export const NOMES_PERFIS = Object.freeze({
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  RECEPCAO: 'Recepção',
  SOLICITANTE: 'Solicitante',
});

export const DESCRICOES_PERFIS = Object.freeze({
  ADMIN: 'Administra todo o sistema, inclusive as contas de acesso.',
  GESTOR: 'Gerencia espaços e recursos, aprova reservas e acompanha relatórios.',
  RECEPCAO: 'Aprova reservas e registra a entrada e a saída das pessoas.',
  SOLICITANTE: 'Consulta a disponibilidade e pede reservas dos espaços.',
});

export const LISTA_PERFIS = Object.values(PERFIS);
export const EQUIPE = [PERFIS.ADMIN, PERFIS.GESTOR, PERFIS.RECEPCAO];
export const GESTAO = [PERFIS.ADMIN, PERFIS.GESTOR];
