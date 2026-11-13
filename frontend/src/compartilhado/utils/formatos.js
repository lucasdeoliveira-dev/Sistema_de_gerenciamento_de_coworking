export const somenteDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');

export function mascaraCpf(texto) {
  const d = somenteDigitos(texto).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function cpfValido(texto) {
  const d = somenteDigitos(texto);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(d.slice(0, 9)) === Number(d[9]) && digito(d.slice(0, 10)) === Number(d[10]);
}

export function mascaraTelefone(texto) {
  const d = somenteDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const emailValido = (texto) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(texto).trim());

export const REQUISITOS_SENHA = [
  { id: 'tamanho', texto: 'Pelo menos 8 caracteres', ok: (s) => s.length >= 8 && s.length <= 72 },
  { id: 'letra', texto: 'Pelo menos uma letra', ok: (s) => /[A-Za-z]/.test(s) },
  { id: 'numero', texto: 'Pelo menos um número', ok: (s) => /[0-9]/.test(s) },
];

export const senhaForte = (senha) => REQUISITOS_SENHA.every((r) => r.ok(senha));

export const vazioParaNull = (texto) => (String(texto ?? '').trim() === '' ? null : String(texto).trim());

export const primeiroNome = (nome) =>
  String(nome ?? '')
    .trim()
    .split(/\s+/)[0];

const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const dataHora = (valor) => (valor ? FORMATO_DATA_HORA.format(new Date(valor)) : '—');

const ESCALAS_TEMPO = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

export function tempoRelativo(valor) {
  if (!valor) return 'nunca';
  const segundos = Math.round((new Date(valor).getTime() - Date.now()) / 1000);
  const formato = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  for (const [unidade, tamanho] of ESCALAS_TEMPO) {
    if (Math.abs(segundos) >= tamanho) return formato.format(Math.round(segundos / tamanho), unidade);
  }
  return 'agora mesmo';
}

const NAVEGADORES = [
  ['PowerShell', /PowerShell/],
  ['Edge', /Edg\//],
  ['Opera', /OPR\//],
  ['Chrome', /Chrome\//],
  ['Firefox', /Firefox\//],
  ['Safari', /Safari\//],
];

const SISTEMAS = [
  ['Windows', /Windows/],
  ['Android', /Android/],
  ['iPhone/iPad', /iPhone|iPad/],
  ['Mac', /Mac OS/],
  ['Linux', /Linux/],
];

const encontrarNome = (lista, texto) => lista.find(([, padrao]) => padrao.test(texto))?.[0];

export function descreverAparelho(userAgent) {
  const navegador = encontrarNome(NAVEGADORES, userAgent ?? '');
  const sistema = encontrarNome(SISTEMAS, userAgent ?? '');
  if (navegador && sistema) return `${navegador} no ${sistema}`;
  return navegador ?? sistema ?? 'Aparelho desconhecido';
}

export const ipLegivel = (ip) => (ip ? ip.replace(/^::ffff:/, '') : '—');

export const normalizarCnpj = (texto) =>
  String(texto ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');

export function mascaraCnpj(texto) {
  return normalizarCnpj(texto)
    .slice(0, 14)
    .replace(/^(.{2})(.)/, '$1.$2')
    .replace(/^(.{2})\.(.{3})(.)/, '$1.$2.$3')
    .replace(/^(.{2})\.(.{3})\.(.{3})(.)/, '$1.$2.$3/$4')
    .replace(/\/(.{4})(.)/, '/$1-$2');
}

const PESOS_CNPJ = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digitoCnpj(base) {
  const pesos = PESOS_CNPJ.slice(PESOS_CNPJ.length - base.length);
  const soma = [...base].reduce((total, caractere, i) => total + (caractere.charCodeAt(0) - 48) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(texto) {
  const valor = normalizarCnpj(texto);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(valor) || /^(.)\1{13}$/.test(valor)) return false;
  const primeiro = digitoCnpj(valor.slice(0, 12));
  const segundo = digitoCnpj(valor.slice(0, 12) + primeiro);
  return valor.endsWith(`${primeiro}${segundo}`);
}
