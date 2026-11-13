function obrigatoria(nome) {
  const valor = process.env[nome];
  if (valor === undefined || valor.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória não definida: ${nome}`);
  }
  return valor.trim();
}

function inteiro(nome, padrao) {
  const bruto = process.env[nome];
  if (bruto === undefined || bruto.trim() === '') return padrao;
  const valor = Number.parseInt(bruto, 10);
  if (Number.isNaN(valor)) throw new Error(`Variável ${nome} deve ser um número inteiro`);
  return valor;
}

const booleano = (nome, padrao) => (process.env[nome] ?? String(padrao)).trim().toLowerCase() === 'true';

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  emProducao: nodeEnv === 'production',
  porta: inteiro('PORT', 3000),
  trustProxy: inteiro('TRUST_PROXY', 0),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/$/, ''),

  db: {
    host: obrigatoria('DB_HOST'),
    port: inteiro('DB_PORT', 5432),
    database: obrigatoria('DB_NAME'),
    user: obrigatoria('DB_USER'),
    password: obrigatoria('DB_PASSWORD'),
  },

  auth: {
    bcryptCusto: inteiro('BCRYPT_CUSTO', 12),
    permitirCadastroPublico: booleano('PERMITIR_CADASTRO_PUBLICO', true),
    sessaoDuracaoHoras: inteiro('SESSAO_DURACAO_HORAS', 8),
    sessaoInatividadeMinutos: inteiro('SESSAO_INATIVIDADE_MINUTOS', 120),
    loginMaxFalhasIp: inteiro('LOGIN_MAX_FALHAS_IP', 30),
    recuperacaoMinutos: inteiro('RECUPERACAO_SENHA_MINUTOS', 30),
    cookieSeguro: booleano('COOKIE_SECURE', nodeEnv === 'production'),
  },

  adminInicial: {
    nome: (process.env.ADMIN_NOME || 'Administrador').trim(),
    email: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    senha: process.env.ADMIN_SENHA || '',
  },
};

const USUARIOS_PROIBIDOS = ['postgres', 'sgec_admin', 'sgec_owner'];
if (USUARIOS_PROIBIDOS.includes(env.db.user)) {
  throw new Error(`A API não pode conectar como "${env.db.user}". Use DB_USER=sgec_app.`);
}

if (env.auth.bcryptCusto < 10 || env.auth.bcryptCusto > 15) {
  throw new Error('BCRYPT_CUSTO deve ficar entre 10 e 15.');
}

if (env.emProducao && !env.auth.cookieSeguro) {
  throw new Error('Em produção, COOKIE_SECURE precisa ser true (cookie só via HTTPS).');
}

module.exports = env;
