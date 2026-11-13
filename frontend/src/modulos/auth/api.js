import { api } from '@/compartilhado/api/cliente';

export const obterEu = () => api('/auth/eu');

export const entrar = (email, senha) => api('/auth/login', { metodo: 'POST', corpo: { email, senha } });

export const sair = () => api('/auth/logout', { metodo: 'POST' });

export const sairDeTodos = () => api('/auth/logout-todos', { metodo: 'POST' });

export const cadastrar = (dados) => api('/auth/registro', { metodo: 'POST', corpo: dados });

export const atualizarEu = (dados) => api('/auth/eu', { metodo: 'PATCH', corpo: dados });

export const trocarSenha = (senhaAtual, novaSenha) =>
  api('/auth/eu/senha', { metodo: 'PUT', corpo: { senhaAtual, novaSenha } });

export const minhasSessoes = () => api('/auth/eu/sessoes');

export const pedirRecuperacao = (email) => api('/auth/recuperar-senha', { metodo: 'POST', corpo: { email } });

export const redefinirSenha = (token, novaSenha) =>
  api('/auth/redefinir-senha', { metodo: 'POST', corpo: { token, novaSenha } });
