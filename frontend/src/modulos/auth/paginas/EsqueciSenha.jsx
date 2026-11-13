import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pedirRecuperacao } from '@/modulos/auth/api';
import { emailValido } from '@/compartilhado/utils/formatos';
import Campo from '@/compartilhado/componentes/Campo';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [erroCampo, setErroCampo] = useState(null);
  const [erro, setErro] = useState(null);
  const [mensagemEnviada, setMensagemEnviada] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);

    if (!emailValido(email)) {
      setErroCampo('Informe um e-mail válido.');
      return;
    }
    setErroCampo(null);

    setEnviando(true);
    try {
      const resposta = await pedirRecuperacao(email.trim());
      setMensagemEnviada(resposta.mensagem);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  if (mensagemEnviada) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Confira o seu e-mail</h1>
        <Alerta tipo="sucesso">{mensagemEnviada}</Alerta>
        <p className="text-suave">
          O link vale por 30 minutos e funciona uma única vez. Não chegou? Veja a caixa de spam ou peça de novo daqui a
          alguns minutos.
        </p>
        <p className="text-center text-sm">
          <Link to="/entrar" className="font-bold text-marca hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Esqueci minha senha</h1>
        <p className="mt-1 text-suave">
          Informe o e-mail da conta e enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erroCampo}
          autoFocus
          required
        />
        <Botao type="submit" carregando={enviando} textoCarregando="Enviando…" className="w-full">
          Enviar link
        </Botao>
      </form>

      <p className="text-center text-sm text-suave">
        Lembrou a senha?{' '}
        <Link to="/entrar" className="font-bold text-marca hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
