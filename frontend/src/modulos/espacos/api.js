import { api } from '@/compartilhado/api/cliente';

export const listarEspacos = (filtros, sinal) => api('/espacos', { consulta: filtros, sinal });

export const criarEspaco = (dados) => api('/espacos', { metodo: 'POST', corpo: dados });

export const atualizarEspaco = (id, dados) => api(`/espacos/${id}`, { metodo: 'PATCH', corpo: dados });
