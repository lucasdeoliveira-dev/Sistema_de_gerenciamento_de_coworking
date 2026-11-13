const { query } = require('../../database/pool');

const HORARIOS = `COALESCE(
         (SELECT json_agg(
                   json_build_object(
                     'id', h.id,
                     'dia_semana', h.dia_semana,
                     'hora_inicio', to_char(h.hora_inicio, 'HH24:MI'),
                     'hora_fim', to_char(h.hora_fim, 'HH24:MI')
                   )
                   ORDER BY h.dia_semana, h.hora_inicio
                 )
            FROM horarios_funcionamento h
           WHERE h.espaco_id = e.id
             AND h.ativo),
         '[]'::json)`;

const SELECAO = `SELECT e.id, e.nome, e.tipo, e.capacidade, e.ativo, e.criado_em, e.atualizado_em,
       ${HORARIOS} AS horarios
  FROM espacos e`;

async function buscarPorId(id, db = { query }) {
  const { rows } = await db.query(`${SELECAO} WHERE e.id = $1`, [id]);
  return rows[0] ?? null;
}

async function criar(db, { nome, tipo, capacidade }) {
  const { rows } = await db.query(
    `INSERT INTO espacos (nome, tipo, capacidade)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [nome, tipo, capacidade],
  );
  return rows[0].id;
}

const CAMPOS_EDITAVEIS = {
  nome: 'nome',
  tipo: 'tipo',
  capacidade: 'capacidade',
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
  const { rowCount } = await db.query(`UPDATE espacos SET ${sets.join(', ')} WHERE id = $${valores.length}`, valores);
  return rowCount === 0 ? null : buscarPorId(id, db);
}

async function substituirHorarios(db, espacoId, horarios) {
  await db.query('UPDATE horarios_funcionamento SET ativo = false WHERE espaco_id = $1 AND ativo = true', [espacoId]);

  for (const faixa of horarios) {
    await db.query(
      `INSERT INTO horarios_funcionamento (espaco_id, dia_semana, hora_inicio, hora_fim)
       VALUES ($1, $2, $3::time, $4::time)`,
      [espacoId, faixa.diaSemana, faixa.horaInicio, faixa.horaFim],
    );
  }
}

async function listar({ pagina, porPagina, busca, tipo, ativo }) {
  const filtros = [];
  const valores = [];

  if (busca) {
    valores.push(`%${busca.replace(/[\\%_]/g, '\\$&')}%`);
    filtros.push(`e.nome ILIKE $${valores.length}`);
  }
  if (tipo) {
    valores.push(tipo);
    filtros.push(`e.tipo = $${valores.length}`);
  }
  if (ativo !== undefined) {
    valores.push(ativo);
    filtros.push(`e.ativo = $${valores.length}`);
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const { rows: contagem } = await query(`SELECT count(*)::int AS total FROM espacos e ${where}`, valores);

  valores.push(porPagina, (pagina - 1) * porPagina);
  const { rows } = await query(
    `${SELECAO} ${where}
      ORDER BY e.nome
      LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );

  return { itens: rows, total: contagem[0].total, pagina, porPagina };
}

module.exports = { buscarPorId, criar, atualizar, substituirHorarios, listar };
