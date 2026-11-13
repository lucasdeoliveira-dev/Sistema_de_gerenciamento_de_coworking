const env = require('../../config/env');
const { query } = require('../../database/pool');

async function registrar({ email, ip, sucesso, motivo }, db = { query }) {
  await db.query('INSERT INTO tentativas_login (email, ip, sucesso, motivo) VALUES ($1, $2, $3, $4)', [
    email,
    ip,
    sucesso,
    sucesso ? null : motivo,
  ]);
}

async function emailBloqueado(email) {
  const { rows } = await query('SELECT fn_login_bloqueado($1) AS bloqueado', [email]);
  return rows[0].bloqueado;
}

async function ipBloqueado(ip) {
  if (!ip) return false;
  const { rows } = await query(
    `SELECT count(*) >= $2 AS bloqueado
       FROM tentativas_login
      WHERE ip = $1 AND NOT sucesso
        AND criado_em > clock_timestamp() - INTERVAL '15 minutes'`,
    [ip, env.auth.loginMaxFalhasIp],
  );
  return rows[0].bloqueado;
}

module.exports = { registrar, emailBloqueado, ipBloqueado };
