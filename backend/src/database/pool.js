const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  ...env.db,
  application_name: 'sgec-api',
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (erro) => {
  console.error('[db] erro inesperado numa conexão ociosa:', erro.message);
});

function query(texto, parametros) {
  return pool.query(texto, parametros);
}

async function transacao(ctx, fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      `SELECT set_config('app.usuario_id', $1, true),
              set_config('app.requisicao_id', $2, true)`,
      [ctx?.usuarioId ?? '', ctx?.requisicaoId ?? ''],
    );
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    cliente.release();
  }
}

function definirUsuarioDaTransacao(db, usuarioId) {
  return db.query(`SELECT set_config('app.usuario_id', $1, true)`, [usuarioId ?? '']);
}

module.exports = { pool, query, transacao, definirUsuarioDaTransacao };
