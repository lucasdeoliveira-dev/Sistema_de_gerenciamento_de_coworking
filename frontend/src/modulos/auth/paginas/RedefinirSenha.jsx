import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/modulos/auth/AuthContext';
import { redefinirSenha } from '@/modulos/auth/api';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { senhaForte } from '@/compartilhado/utils/formatos';
import CampoSenha from '@/compartilhado/componentes/CampoSenha';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

export default function RedefinirSenha() {
  const { esquecerSessao } = useAuth();
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const [token] = useState(() => parametros.get('token') ?? '');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [errosCampo, setErrosCampo] = useState({});
  const [erro, setErro] = useState(null);
  const [linkInvalido, setLinkInvalido] = useState(!FORMATO_TOKEN.test(token));
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (parametros.has('token')) setParametros({}, { replace: true });
  }, [parametros, setParametros]);

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);

    const erros = {};
    if (!senhaForte(senha)) erros.novaSenha = 'A senha ainda não atende a todos os requisitos.';
    if (confirmacao !== senha) erros.confirmacao = 'As senhas não são iguais.';
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) return;

    setEnviando(true);
    try {
      await redefinirSenha(token, senha);
      esquecerSessao();
      navigate('/entrar?aviso=senha-redefinida', { replace: true });
    } catch (falha) {
      if (falha.codigo === 'LINK_INVALIDO' || errosPorCampo(falha).token) {
        setLinkInvalido(true);
      } else {
        setErro(falha.message);
        setErrosCampo(errosPorCampo(falha));
      }
      setEnviando(false);
    }
  }

  if (linkInvalido) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Link inválido ou expirado</h1>
        <p className="text-suave">
          Cada link de redefinição vale por 30 minutos e funciona uma única vez. Peça um novo para continuar.
        </p>
        <Link
          to="/esqueci-senha"
          className="block w-full rounded-lg bg-marca px-4 py-2.5 text-center font-bold text-contraste hover:bg-marca-escura"
        >
          Pedir um novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Criar uma nova senha</h1>
        <p className="mt-1 text-suave">Depois de salvar, você sai de todos os aparelhos e entra com a senha nova.</p>
      </div>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <form onSubmit={enviar} noValidate className="space-y-4">
        <CampoSenha
          rotulo="Nova senha"
          name="nova-senha"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={errosCampo.novaSenha}
          mostrarRequisitos
          autoFocus
          required
        />
        <CampoSenha
          rotulo="Repita a nova senha"
          name="confirmacao"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          erro={errosCampo.confirmacao}
          required
        />
        <Botao type="submit" carregando={enviando} textoCarregando="Salvando…" className="w-full">
          Salvar nova senha
        </Botao>
      </form>
    </div>
  );
}
