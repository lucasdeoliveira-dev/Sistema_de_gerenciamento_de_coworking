const env = require('./config/env');
const app = require('./app');
const { pool } = require('./database/pool');
const { garantirAdminInicial } = require('./database/adminInicial');

async function iniciar() {
  await pool.query('SELECT 1');
  await garantirAdminInicial();

  const servidor = app.listen(env.porta, () => {
    console.log(`[api] SGEC rodando na porta ${env.porta} (${env.nodeEnv}) como usuário "${env.db.user}"`);
  });

  const encerrar = (sinal) => {
    console.log(`[api] ${sinal} recebido, encerrando...`);
    servidor.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

iniciar().catch((erro) => {
  console.error('[api] não foi possível iniciar:', erro.message);
  process.exit(1);
});
