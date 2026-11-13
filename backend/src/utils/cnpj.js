const PESOS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digitoVerificador(base) {
  const pesos = PESOS.slice(PESOS.length - base.length);
  const soma = [...base].reduce((total, caractere, i) => total + (caractere.charCodeAt(0) - 48) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cnpjValido(cnpj) {
  const valor = String(cnpj)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(valor) || /^(.)\1{13}$/.test(valor)) return false;

  const primeiro = digitoVerificador(valor.slice(0, 12));
  const segundo = digitoVerificador(valor.slice(0, 12) + primeiro);
  return valor.endsWith(`${primeiro}${segundo}`);
}

module.exports = { cnpjValido };
