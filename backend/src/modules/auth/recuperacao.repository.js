const { query } = require('../../database/pool');
const { hashToken } = require('../../utils/tokens');

async function pedidoRecente(usuarioId) {
  const { rows } = await query(
    `SELECT EXISTS (
       SELECT 1 FROM tokens_recuperacao_senha
        WHERE usuario_id = $1 AND criado_em > clock_timestamp() - INTERVAL '2 minutes'
     ) AS recente`,
    [usuarioId],
  );
  return rows[0].recente;
}

async function criar(db, { usuarioId, token, minutos, ip }) {
  await invalidarPendentes(db, usuarioId);
  await db.query(
    `INSERT INTO tokens_recuperacao_senha (usuario_id, token_hash, ip_solicitacao, expira_em)
     VALUES ($1, $2, $3, clock_timestamp() + make_interval(mins => $4))`,
    [usuarioId, hashToken(token), ip, minutos],
  );
}

async function buscarParaUso(db, token) {
  const { rows } = await db.query(
    `SELECT t.id, t.usuario_id, t.expira_em, t.usado_em, u.ativo
       FROM tokens_recuperacao_senha t
       JOIN usuarios u ON u.id = t.usuario_id
      WHERE t.token_hash = $1
        FOR UPDATE OF t`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

async function marcarUsado(db, id) {
  await db.query('UPDATE tokens_recuperacao_senha SET usado_em = clock_timestamp() WHERE id = $1', [id]);
}

async function invalidarPendentes(db, usuarioId) {
  await db.query(
    `UPDATE tokens_recuperacao_senha SET usado_em = clock_timestamp()
      WHERE usuario_id = $1 AND usado_em IS NULL`,
    [usuarioId],
  );
}

module.exports = { pedidoRecente, criar, buscarParaUso, marcarUsado, invalidarPendentes };
