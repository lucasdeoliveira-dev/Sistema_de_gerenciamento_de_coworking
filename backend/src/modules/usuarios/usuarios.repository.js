const { query } = require('../../database/pool');

const SELECAO = `SELECT u.id, u.nome, u.email, u.cpf, u.telefone, u.perfil, u.ativo,
       u.email_verificado_em, u.ultimo_login_em, u.criado_em, u.atualizado_em,
       CASE WHEN u.empresa_id IS NULL THEN 'FISICA' ELSE 'JURIDICA' END AS tipo_pessoa,
       CASE WHEN e.id IS NULL THEN NULL
            ELSE json_build_object('id', e.id, 'cnpj', e.cnpj, 'razao_social', e.razao_social,
                                   'nome_fantasia', e.nome_fantasia)
       END AS empresa
  FROM vw_usuarios u
  LEFT JOIN empresas e ON e.id = u.empresa_id`;

async function buscarPorId(id, db = { query }) {
  const { rows } = await db.query(`${SELECAO} WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

async function buscarParaLogin(email) {
  const { rows } = await query('SELECT id, perfil, ativo, senha_hash FROM usuarios WHERE email = $1', [email]);
  return rows[0] ?? null;
}

async function buscarSenhaHash(id) {
  const { rows } = await query('SELECT senha_hash FROM usuarios WHERE id = $1', [id]);
  return rows[0]?.senha_hash ?? null;
}

async function buscarResumoPorEmail(email) {
  const { rows } = await query('SELECT id, nome, perfil, ativo FROM vw_usuarios WHERE email = $1', [email]);
  return rows[0] ?? null;
}

async function criar(db, { nome, email, cpf, telefone, senhaHash, perfil, empresaId }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome, email, cpf, telefone, senha_hash, perfil, empresa_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [nome, email, cpf ?? null, telefone ?? null, senhaHash, perfil, empresaId ?? null],
  );
  return buscarPorId(rows[0].id, db);
}

const CAMPOS_EDITAVEIS = {
  nome: 'nome',
  cpf: 'cpf',
  telefone: 'telefone',
  perfil: 'perfil',
  ativo: 'ativo',
};

async function atualizar(db, id, campos) {
  const sets = [];
  const valores = [];

  for (const [chave, coluna] of Object.entries(CAMPOS_EDITAVEIS)) {
    if (campos[chave] !== undefined) {
      valores.push(campos[chave]);
      sets.push(`${coluna} = $${valores.length}`);
    }
  }
  if (sets.length === 0) return buscarPorId(id, db);

  valores.push(id);
  const { rowCount } = await db.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${valores.length}`, valores);
  return rowCount === 0 ? null : buscarPorId(id, db);
}

async function atualizarSenha(db, id, senhaHash) {
  const { rowCount } = await db.query('UPDATE usuarios SET senha_hash = $2 WHERE id = $1', [id, senhaHash]);
  return rowCount > 0;
}

async function registrarLogin(db, id) {
  await db.query('UPDATE usuarios SET ultimo_login_em = clock_timestamp() WHERE id = $1', [id]);
}

async function listar({ pagina, porPagina, busca, perfil, ativo, tipoPessoa }) {
  const filtros = [];
  const valores = [];

  if (busca) {
    valores.push(`%${busca.replace(/[\\%_]/g, '\\$&')}%`);
    const n = valores.length;
    filtros.push(
      `(u.nome ILIKE $${n} OR u.email::text ILIKE $${n} OR e.razao_social ILIKE $${n} OR e.nome_fantasia ILIKE $${n})`,
    );
  }
  if (perfil) {
    valores.push(perfil);
    filtros.push(`u.perfil = $${valores.length}`);
  }
  if (ativo !== undefined) {
    valores.push(ativo);
    filtros.push(`u.ativo = $${valores.length}`);
  }
  if (tipoPessoa) {
    filtros.push(tipoPessoa === 'JURIDICA' ? 'u.empresa_id IS NOT NULL' : 'u.empresa_id IS NULL');
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const { rows: contagem } = await query(
    `SELECT count(*)::int AS total FROM vw_usuarios u LEFT JOIN empresas e ON e.id = u.empresa_id ${where}`,
    valores,
  );

  valores.push(porPagina, (pagina - 1) * porPagina);
  const { rows } = await query(
    `${SELECAO} ${where}
      ORDER BY u.nome
      LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );

  return { itens: rows, total: contagem[0].total, pagina, porPagina };
}

module.exports = {
  buscarPorId,
  buscarParaLogin,
  buscarSenhaHash,
  buscarResumoPorEmail,
  criar,
  atualizar,
  atualizarSenha,
  registrarLogin,
  listar,
};
