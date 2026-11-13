const { query } = require('../../database/pool');

async function buscarIdPorCnpj(cnpj, db = { query }) {
  const { rows } = await db.query('SELECT id FROM empresas WHERE cnpj = $1', [cnpj]);
  return rows[0]?.id ?? null;
}

async function criar(db, { cnpj, razaoSocial, nomeFantasia }) {
  const { rows } = await db.query(
    `INSERT INTO empresas (cnpj, razao_social, nome_fantasia)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [cnpj, razaoSocial, nomeFantasia ?? null],
  );
  return rows[0].id;
}

const CAMPOS_EDITAVEIS = {
  razaoSocial: 'razao_social',
  nomeFantasia: 'nome_fantasia',
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
  if (sets.length === 0) return;

  valores.push(id);
  await db.query(`UPDATE empresas SET ${sets.join(', ')} WHERE id = $${valores.length}`, valores);
}

module.exports = { buscarIdPorCnpj, criar, atualizar };
