function cpfValido(cpf) {
  const numeros = String(cpf).replace(/\D/g, '');
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(numeros.slice(0, 9)) === Number(numeros[9]) && digito(numeros.slice(0, 10)) === Number(numeros[10]);
}

module.exports = { cpfValido };
