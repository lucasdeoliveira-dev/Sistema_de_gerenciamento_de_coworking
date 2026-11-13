const PERFIS = Object.freeze({
  ADMIN: 'ADMIN',
  GESTOR: 'GESTOR',
  RECEPCAO: 'RECEPCAO',
  SOLICITANTE: 'SOLICITANTE',
});

const LISTA_PERFIS = Object.freeze(Object.values(PERFIS));

const EQUIPE = Object.freeze([PERFIS.ADMIN, PERFIS.GESTOR, PERFIS.RECEPCAO]);
const GESTAO = Object.freeze([PERFIS.ADMIN, PERFIS.GESTOR]);

module.exports = { PERFIS, LISTA_PERFIS, EQUIPE, GESTAO };
