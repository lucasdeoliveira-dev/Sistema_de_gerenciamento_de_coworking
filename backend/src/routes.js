const { Router } = require('express');
const { query } = require('./database/pool');

const router = Router();

router.get('/saude', async (req, res) => {
  const { rows } = await query('SELECT current_user AS usuario_banco, now() AS horario');
  res.json({ status: 'ok', ...rows[0] });
});

router.use('/auth', require('./modules/auth/auth.routes'));
router.use('/usuarios', require('./modules/usuarios/usuarios.routes'));

module.exports = router;
