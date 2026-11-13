import { useEffect, useState } from 'react';
import { useAuth } from '@/modulos/auth/AuthContext';
import { listarEspacos } from '@/modulos/espacos/api';
import { GESTAO } from '@/compartilhado/config/perfis';
import { useValorAtrasado } from '@/compartilhado/hooks/useValorAtrasado';
import CabecalhoPagina from '@/compartilhado/componentes/CabecalhoPagina';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';
import EstadoVazio from '@/compartilhado/componentes/EstadoVazio';
import Paginacao from '@/compartilhado/componentes/Paginacao';
import FiltrosEspacos from '@/modulos/espacos/componentes/FiltrosEspacos';
import TabelaEspacos from '@/modulos/espacos/componentes/TabelaEspacos';
import ModalEspaco from '@/modulos/espacos/componentes/ModalEspaco';

const POR_PAGINA = 20;

export default function Espacos() {
  const { usuario } = useAuth();
  const podeGerir = GESTAO.includes(usuario.perfil);
  const [buscaDigitada, setBuscaDigitada] = useState('');
  const [filtros, setFiltros] = useState({ tipo: '', ativo: '' });
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
    listarEspacos(
      { ...filtros, busca, pagina, porPagina: POR_PAGINA, ...(podeGerir ? {} : { ativo: 'true' }) },
      controle.signal,
    )
      .then((dados) => {
        setResultado(dados);
        setErro(null);
      })
      .catch((falha) => {
        if (falha.name !== 'AbortError') setErro(falha.message);
      });
    return () => controle.abort();
  }, [filtros, busca, pagina, versao, podeGerir]);

  function mudarBusca(valor) {
    setBuscaDigitada(valor);
    setPagina(1);
  }

  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
    setPagina(1);
  }

  function concluir(salvo, mensagem) {
    setCriando(false);
    setEditando(null);
    setAviso(mensagem ?? `Espaço ${salvo.nome} salvo.`);
    setVersao((atual) => atual + 1);
  }

  const filtrando = Boolean(busca || filtros.tipo || filtros.ativo);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Espaços"
        descricao="Coworking, laboratórios e salas, com os dias e horários em que funcionam."
      >
        {podeGerir && <Botao onClick={() => setCriando(true)}>Novo espaço</Botao>}
      </CabecalhoPagina>

      {aviso && <Alerta tipo="sucesso">{aviso}</Alerta>}

      <FiltrosEspacos
        busca={buscaDigitada}
        tipo={filtros.tipo}
        ativo={filtros.ativo}
        mostrarSituacao={podeGerir}
        aoMudarBusca={mudarBusca}
        aoMudarFiltro={mudarFiltro}
      />

      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {!resultado && !erro && <p className="text-sm text-suave">Carregando espaços…</p>}

      {resultado && resultado.itens.length === 0 && (
        <EstadoVazio
          titulo={filtrando ? 'Nenhum espaço com esses filtros.' : 'Nenhum espaço cadastrado.'}
          texto={
            filtrando
              ? 'Mude a busca ou limpe os filtros para ver mais espaços.'
              : podeGerir
                ? 'Cadastre o primeiro espaço e a grade de funcionamento.'
                : 'Quando a gestão cadastrar um espaço, ele aparece aqui.'
          }
        />
      )}

      {resultado && resultado.itens.length > 0 && (
        <>
          <TabelaEspacos espacos={resultado.itens} aoEditar={podeGerir ? setEditando : null} />
          <Paginacao pagina={pagina} porPagina={POR_PAGINA} total={resultado.total} aoMudarPagina={setPagina} />
        </>
      )}

      <ModalEspaco
        aberto={criando}
        espaco={null}
        aoFechar={() => setCriando(false)}
        aoSalvar={(salvo) => concluir(salvo, `Espaço ${salvo.nome} criado.`)}
      />
      <ModalEspaco
        aberto={Boolean(editando)}
        espaco={editando}
        aoFechar={() => setEditando(null)}
        aoSalvar={(salvo) => concluir(salvo, `Espaço ${salvo.nome} atualizado.`)}
      />
    </div>
  );
}
