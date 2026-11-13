const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { transacao } = require('./pool');
const usuariosRepo = require('../modules/usuarios/usuarios.repository');

function validarSenhaAdmin(senha) {
  const problemas = [];
  if (senha.length < 12) problemas.push('ter pelo menos 12 caracteres');
  if (senha.length > 72) problemas.push('ter no máximo 72 caracteres');
  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) problemas.push('misturar letras e números');
  if (/troque|senha|admin|123456/i.test(senha)) problemas.push('não ser um valor de exemplo');
  return problemas;
}

async function garantirAdminInicial() {
  const { nome, email, senha } = env.adminInicial;

  if (!email) {
    console.log('[admin] ADMIN_EMAIL não definido — nenhum administrador inicial criado.');
    return;
  }

  const existente = await usuariosRepo.buscarResumoPorEmail(email);
  if (existente) {
    if (existente.perfil !== 'ADMIN') {
      console.warn(`[admin] ATENÇÃO: ${email} já existe com perfil ${existente.perfil} e NÃO foi promovido.`);
    }
    return;
  }

  const problemas = validarSenhaAdmin(senha);
  if (problemas.length > 0) {
    throw new Error(`ADMIN_SENHA inválida: precisa ${problemas.join(', ')}.`);
  }

  await transacao({}, async (db) =>
    usuariosRepo.criar(db, {
      nome,
      email,
      senhaHash: await bcrypt.hash(senha, env.auth.bcryptCusto),
      perfil: 'ADMIN',
    }),
  );
  console.log(`[admin] administrador inicial criado: ${email}`);
}

module.exports = { garantirAdminInicial };
