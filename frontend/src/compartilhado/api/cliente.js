const BASE = '/api';

export class ApiError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes ?? [];
  }
}

let aoPerderSessao = null;
export function definirAoPerderSessao(funcao) {
  aoPerderSessao = funcao;
}

export async function api(caminho, { metodo = 'GET', corpo, consulta, sinal } = {}) {
  let url = BASE + caminho;

  if (consulta) {
    const parametros = new URLSearchParams();
    for (const [chave, valor] of Object.entries(consulta)) {
      if (valor !== undefined && valor !== null && valor !== '') parametros.set(chave, String(valor));
    }
    const texto = parametros.toString();
    if (texto) url += `?${texto}`;
  }

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      credentials: 'include',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: sinal,
    });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new ApiError(
      0,
      'SEM_CONEXAO',
      'Não foi possível falar com o servidor. Confira se o sistema está no ar e tente de novo.',
    );
  }

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = dados?.erro ?? {};
    const apiError = new ApiError(
      resposta.status,
      erro.codigo ?? 'ERRO_DESCONHECIDO',
      erro.mensagem ?? 'Algo deu errado. Tente novamente em instantes.',
      erro.detalhes,
    );
    if (resposta.status === 401 && ['NAO_AUTENTICADO', 'SESSAO_EXPIRADA'].includes(apiError.codigo)) {
      aoPerderSessao?.(apiError);
    }
    throw apiError;
  }

  return dados;
}

export function errosPorCampo(erro) {
  const mapa = {};
  for (const detalhe of erro?.detalhes ?? []) {
    if (detalhe.campo && !mapa[detalhe.campo]) mapa[detalhe.campo] = detalhe.mensagem;
  }
  return mapa;
}
