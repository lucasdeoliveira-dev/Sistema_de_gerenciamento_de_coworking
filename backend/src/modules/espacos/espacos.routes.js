const { Router } = require('express');
const { GESTAO } = require('../../config/perfis');
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const validar = require('../../middlewares/validar');
const controller = require('./espacos.controller');
const s = require('./espacos.schemas');

const router = Router();

router.get('/', autenticar, validar({ query: s.listarQuery }), controller.listar);
router.post('/', autenticar, autorizar(...GESTAO), validar({ body: s.criarSchema }), controller.criar);
router.get('/:id', autenticar, validar({ params: s.idParams }), controller.obter);
router.patch(
  '/:id',
  autenticar,
  autorizar(...GESTAO),
  validar({ params: s.idParams, body: s.atualizarSchema }),
  controller.atualizar,
);

module.exports = router;
