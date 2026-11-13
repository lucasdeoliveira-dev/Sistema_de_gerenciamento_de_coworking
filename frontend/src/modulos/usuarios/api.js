import { api } from '@/compartilhado/api/cliente';

export const listarUsuarios = (filtros, sinal) => api('/usuarios', { consulta: filtros, sinal });

export const criarUsuario = (dados) => api('/usuarios', { metodo: 'POST', corpo: dados });

export const atualizarUsuario = (id, dados) => api(`/usuarios/${id}`, { metodo: 'PATCH', corpo: dados });

export const redefinirSenhaUsuario = (id, novaSenha) =>
  api(`/usuarios/${id}/senha`, { metodo: 'PUT', corpo: { novaSenha } });
