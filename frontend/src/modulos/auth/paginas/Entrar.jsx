import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/modulos/auth/AuthContext';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { emailValido } from '@/compartilhado/utils/formatos';
import Campo from '@/compartilhado/componentes/Campo';
import CampoSenha from '@/compartilhado/componentes/CampoSenha';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';

const AVISOS = {
  'senha-redefinida': 'Senha redefinida. Entre com a nova senha.',
  'sessoes-encerradas': 'Você saiu de todos os aparelhos. Entre novamente para continuar.',
  'conta-criada': 'Conta criada. Entre com o seu e-mail e a senha escolhida.',
};

export default function Entrar() {
  const { entrar, sessaoEncerrada } = useAuth();
  const [parametros] = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [errosCampo, setErrosCampo] = useState({});
  const [enviando, setEnviando] = useState(false);

  const aviso = AVISOS[parametros.get('aviso')];

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);

    const novos = {};
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.';
    if (!senha) novos.senha = 'Informe a sua senha.';
    setErrosCampo(novos);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (falha) {
      setErro(falha.message);
      setErrosCampo(errosPorCampo(falha));
      setSenha('');
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="mt-1 text-suave">Use o e-mail e a senha da sua conta.</p>
      </div>

      {sessaoEncerrada && !erro && (
        <Alerta tipo="info">Sua sessão terminou. Entre novamente para continuar de onde parou.</Alerta>
      )}
      {aviso && !sessaoEncerrada && !erro && <Alerta tipo="sucesso">{aviso}</Alerta>}
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
          erro={errosCampo.email}
          autoFocus
          required
        />
        <CampoSenha
          rotulo="Senha"
          name="senha"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={errosCampo.senha}
          required
        />
        <p className="text-right text-sm">
          <Link to="/esqueci-senha" className="font-bold text-marca hover:underline">
            Esqueci minha senha
          </Link>
        </p>
        <Botao type="submit" carregando={enviando} textoCarregando="Entrando…" className="w-full">
          Entrar
        </Botao>
      </form>

      <p className="text-center text-sm text-suave">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-bold text-marca hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
