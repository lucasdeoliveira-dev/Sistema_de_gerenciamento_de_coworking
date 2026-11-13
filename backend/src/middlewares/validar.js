const AppError = require('../utils/AppError');

function validar(schemas) {
  return (req, res, next) => {
    req.validado = {};
    const erros = [];

    for (const parte of ['params', 'query', 'body']) {
      const schema = schemas[parte];
      if (!schema) continue;

      const resultado = schema.safeParse(req[parte] ?? {});
      if (resultado.success) {
        req.validado[parte] = resultado.data;
      } else {
        for (const issue of resultado.error.issues) {
          erros.push({ local: parte, campo: issue.path.join('.') || null, mensagem: issue.message });
        }
      }
    }

    if (erros.length > 0) {
      throw new AppError(400, 'DADOS_INVALIDOS', 'Verifique os dados enviados.', erros);
    }
    next();
  };
}

module.exports = validar;
