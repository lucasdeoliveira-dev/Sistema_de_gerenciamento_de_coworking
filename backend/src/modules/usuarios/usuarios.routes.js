const { Router } = require('express');
const { PERFIS } = require('../../config/perfis');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const validar = require('../../middlewares/validar');
const controller = require('./usuarios.controller');
const s = require('./usuarios.schemas');

const router = Router();

router.use(autenticar, autorizar(PERFIS.ADMIN));

router.get('/', validar({ query: s.listarQuery }), controller.listar);
router.post('/', validar({ body: s.criarSchema }), controller.criar);
router.get('/:id', validar({ params: s.idParams }), controller.obter);
router.patch('/:id', validar({ params: s.idParams, body: s.atualizarSchema }), controller.atualizar);
router.put('/:id/senha', validar({ params: s.idParams, body: s.redefinirSenhaSchema }), controller.redefinirSenha);

module.exports = router;
