import { cpfValido, somenteDigitos } from '@/compartilhado/utils/formatos';

export function validarContato(dados) {
  const erros = {};
  if (dados.nome.trim().length < 2) erros.nome = 'Informe o nome completo.';
  if (dados.cpf && !cpfValido(dados.cpf)) erros.cpf = 'CPF inválido. Confira os números.';
  if (dados.telefone && somenteDigitos(dados.telefone).length < 10) erros.telefone = 'Informe o DDD e o número.';
  return erros;
}
