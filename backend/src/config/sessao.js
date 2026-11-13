const env = require('./env');

const COOKIE_SESSAO = 'sgec_sessao';

function opcoesCookie() {
  return {
    httpOnly: true,
    secure: env.auth.cookieSeguro,
    sameSite: 'strict',
    path: '/api',
  };
}

module.exports = { COOKIE_SESSAO, opcoesCookie };
