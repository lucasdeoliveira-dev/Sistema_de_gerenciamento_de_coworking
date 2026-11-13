const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const rotas = require('./routes');
const contexto = require('./middlewares/contexto');
const { tratarErros, rotaNaoEncontrada } = require('./middlewares/tratarErros');

const app = express();

app.disable('x-powered-by');

if (env.trustProxy > 0) app.set('trust proxy', env.trustProxy);

app.use(contexto);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

if (!env.emProducao) app.use('/api/docs', require('./docs/swagger'));
app.use('/api', rotas);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
