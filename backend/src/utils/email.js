const env = require('../config/env');

async function enviarRecuperacaoSenha({ para, nome, token, minutos }) {
  const link = `${env.frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

  if (env.emProducao) {
    console.warn(`[email] envio de e-mail não configurado — recuperação para ${para} não foi enviada.`);
    return;
  }

  console.log(`[email] (desenvolvimento) Recuperação de senha para ${nome} <${para}> — válido por ${minutos} min:`);
  console.log(`[email]   ${link}`);
}

module.exports = { enviarRecuperacaoSenha };
