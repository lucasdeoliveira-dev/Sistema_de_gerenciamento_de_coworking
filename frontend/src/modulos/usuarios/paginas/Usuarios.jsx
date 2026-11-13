import { useEffect, useState } from 'react';
import { useAuth } from '@/modulos/auth/AuthContext';
import { listarUsuarios } from '@/modulos/usuarios/api';
import { useValorAtrasado } from '@/compartilhado/hooks/useValorAtrasado';
import CabecalhoPagina from '@/compartilhado/componentes/CabecalhoPagina';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';
import EstadoVazio from '@/compartilhado/componentes/EstadoVazio';
import Paginacao from '@/compartilhado/componentes/Paginacao';
import FiltrosUsuarios from '@/modulos/usuarios/componentes/FiltrosUsuarios';
import TabelaUsuarios from '@/modulos/usuarios/componentes/TabelaUsuarios';
import ModalNovoUsuario from '@/modulos/usuarios/componentes/ModalNovoUsuario';
import ModalEditarUsuario from '@/modulos/usuarios/componentes/ModalEditarUsuario';

const POR_PAGINA = 20;

export default function Usuarios() {
  const { usuario: eu, atualizarUsuario: atualizarEu } = useAuth();
  const [buscaDigitada, setBuscaDigitada] = useState('');
  const [filtros, setFiltros] = useState({ perfil: '', tipoPessoa: '', ativo: '' });
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [versao, setVersao] = useState(0);

  const busca = useValorAtrasado(buscaDigitada.trim());

  useEffect(() => {
    const controle = new AbortController();
    listarUsuarios({ ...filtros, busca, pagina, porPagina: POR_PAGINA }, controle.signal)
      .then((dados) => {
        setResultado(dados);
        setErro(null);
      })
      .catch((falha) => {
        if (falha.name !== 'AbortError') setErro(falha.message);
      });
    return () => controle.abort();
  }, [filtros, busca, pagina, versao]);

  function mudarBusca(valor) {
    setBuscaDigitada(valor);
    setPagina(1);
  }

  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
    setPagina(1);
  }

  function abrirCriacao() {
    setAviso(null);
    setCriando(true);
  }

  function abrirEdicao(usuario) {
    setAviso(null);
    setEditando(usuario);
  }

  function concluirCriacao(criado) {
    setCriando(false);
    setAviso(`Conta de ${criado.nome} criada. Passe a senha provisória para a pessoa trocar no primeiro acesso.`);
    setVersao((atual) => atual + 1);
  }

  function concluirEdicao(salvo, mensagem) {
    setEditando(null);
    setAviso(mensagem);
    if (salvo.id === eu.id) atualizarEu({ ...eu, ...salvo });
    setVersao((atual) => atual + 1);
  }

  const filtrando = Boolean(busca || filtros.perfil || filtros.tipoPessoa || filtros.ativo);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Contas de acesso ao sistema. Ninguém é excluído: quem não usa mais é desativado."
      >
        <Botao onClick={abrirCriacao}>Novo usuário</Botao>
      </CabecalhoPagina>

      {aviso && <Alerta tipo="sucesso">{aviso}</Alerta>}

      <FiltrosUsuarios
        busca={buscaDigitada}
        perfil={filtros.perfil}
        tipoPessoa={filtros.tipoPessoa}
        ativo={filtros.ativo}
        aoMudarBusca={mudarBusca}
        aoMudarFiltro={mudarFiltro}
      />

      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {!resultado && !erro && <p className="text-sm text-suave">Carregando usuários…</p>}

      {resultado && resultado.itens.length === 0 && (
        <EstadoVazio
          titulo={filtrando ? 'Nenhum usuário com esses filtros.' : 'Nenhum usuário cadastrado.'}
          texto={
            filtrando ? 'Mude a busca ou limpe os filtros para ver mais contas.' : 'Crie a primeira conta da equipe.'
          }
        />
      )}

      {resultado && resultado.itens.length > 0 && (
        <>
          <TabelaUsuarios usuarios={resultado.itens} idUsuarioLogado={eu.id} aoEditar={abrirEdicao} />
          <Paginacao pagina={pagina} porPagina={POR_PAGINA} total={resultado.total} aoMudarPagina={setPagina} />
        </>
      )}

      <ModalNovoUsuario aberto={criando} aoFechar={() => setCriando(false)} aoCriar={concluirCriacao} />

      <ModalEditarUsuario
        usuario={editando}
        ehVoceMesmo={editando?.id === eu.id}
        aoFechar={() => setEditando(null)}
        aoSalvar={concluirEdicao}
      />
    </div>
  );
}
