const { Router } = require('express');
const autenticar = require('../../middlewares/autenticar');
const validar = require('../../middlewares/validar');
const controller = require('./auth.controller');
const s = require('./auth.schemas');

const router = Router();

router.post('/registro', validar({ body: s.registroSchema }), controller.registrar);
router.post('/login', validar({ body: s.loginSchema }), controller.login);
router.post('/logout', controller.logout);
router.post('/recuperar-senha', validar({ body: s.recuperarSenhaSchema }), controller.solicitarRecuperacao);
router.post('/redefinir-senha', validar({ body: s.redefinirSenhaSchema }), controller.redefinirSenha);

router.get('/eu', autenticar, controller.eu);
router.patch('/eu', autenticar, validar({ body: s.atualizarEuSchema }), controller.atualizarEu);
router.put('/eu/senha', autenticar, validar({ body: s.trocarSenhaSchema }), controller.trocarSenha);
router.get('/eu/sessoes', autenticar, controller.minhasSessoes);
router.post('/logout-todos', autenticar, controller.logoutTodos);

module.exports = router;
