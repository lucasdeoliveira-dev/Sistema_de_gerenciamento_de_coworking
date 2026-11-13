const { query } = require('../../database/pool');
const { hashToken } = require('../../utils/tokens');

async function criar(db, { usuarioId, token, horas, ip, userAgent }) {
  const { rows } = await db.query(
    `INSERT INTO sessoes (usuario_id, token_hash, ip, user_agent, expira_em)
     VALUES ($1, $2, $3, $4, clock_timestamp() + make_interval(hours => $5))
     RETURNING id, expira_em`,
    [usuarioId, hashToken(token), ip, userAgent, horas],
  );
  return rows[0];
}

async function buscarAtivaPorToken(token, minutosInatividade) {
  const { rows } = await query(
    `SELECT s.id AS sessao_id, s.ultimo_acesso_em,
            u.id AS usuario_id, u.nome, u.email, u.perfil
       FROM sessoes s
       JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.token_hash = $1
        AND s.revogada_em IS NULL
        AND s.expira_em > clock_timestamp()
        AND s.ultimo_acesso_em > clock_timestamp() - make_interval(mins => $2)
        AND u.ativo`,
    [hashToken(token), minutosInatividade],
  );
  return rows[0] ?? null;
}

async function registrarAcesso(sessaoId) {
  await query('UPDATE sessoes SET ultimo_acesso_em = clock_timestamp() WHERE id = $1', [sessaoId]);
}

async function revogarPorToken(token) {
  await query('UPDATE sessoes SET revogada_em = clock_timestamp() WHERE token_hash = $1 AND revogada_em IS NULL', [
    hashToken(token),
  ]);
}

async function revogarTodasDoUsuario(usuarioId) {
  const { rowCount } = await query(
    'UPDATE sessoes SET revogada_em = clock_timestamp() WHERE usuario_id = $1 AND revogada_em IS NULL',
    [usuarioId],
  );
  return rowCount;
}

async function listarAtivasDoUsuario(usuarioId) {
  const { rows } = await query(
    `SELECT id, ip, user_agent, criada_em, ultimo_acesso_em, expira_em
       FROM sessoes
      WHERE usuario_id = $1 AND revogada_em IS NULL AND expira_em > clock_timestamp()
      ORDER BY ultimo_acesso_em DESC`,
    [usuarioId],
  );
  return rows;
}

module.exports = {
  criar,
  buscarAtivaPorToken,
  registrarAcesso,
  revogarPorToken,
  revogarTodasDoUsuario,
  listarAtivasDoUsuario,
};
