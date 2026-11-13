import { useState } from 'react';
import { atualizarUsuario } from '@/modulos/usuarios/api';
import { validarContato } from '@/modulos/usuarios/validacao';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { mascaraCpf, mascaraTelefone, somenteDigitos, vazioParaNull } from '@/compartilhado/utils/formatos';
import { empresaParaFormulario, errosDaEmpresa, validarEmpresa } from '@/compartilhado/utils/empresa';
import Modal from '@/compartilhado/componentes/Modal';
import Campo from '@/compartilhado/componentes/Campo';
import CamposEmpresa from '@/compartilhado/componentes/CamposEmpresa';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';
import SeletorPerfil from '@/modulos/usuarios/componentes/SeletorPerfil';
import FormRedefinirSenha from '@/modulos/usuarios/componentes/FormRedefinirSenha';

function dadosIniciais(usuario) {
  return {
    nome: usuario.nome,
    cpf: usuario.cpf ? mascaraCpf(usuario.cpf) : '',
    telefone: usuario.telefone ? mascaraTelefone(usuario.telefone) : '',
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    empresa: empresaParaFormulario(usuario.empresa),
  };
}

function calcularMudancasEmpresa(dados, empresa) {
  if (!empresa) return null;
  const razaoSocial = dados.razaoSocial.trim();
  const nomeFantasia = vazioParaNull(dados.nomeFantasia);
  const mudancas = {};
  if (razaoSocial !== empresa.razao_social) mudancas.razaoSocial = razaoSocial;
  if (nomeFantasia !== (empresa.nome_fantasia ?? null)) mudancas.nomeFantasia = nomeFantasia;
  return Object.keys(mudancas).length > 0 ? mudancas : null;
}

function calcularMudancas(dados, usuario, ehVoceMesmo) {
  const cpf = dados.cpf ? somenteDigitos(dados.cpf) : null;
  const telefone = vazioParaNull(dados.telefone);
  const mudancas = {};
  if (dados.nome.trim() !== usuario.nome) mudancas.nome = dados.nome.trim();
  if (cpf !== (usuario.cpf ?? null)) mudancas.cpf = cpf;
  if (telefone !== (usuario.telefone ?? null)) mudancas.telefone = telefone;
  if (!ehVoceMesmo && dados.perfil !== usuario.perfil) mudancas.perfil = dados.perfil;
  if (!ehVoceMesmo && dados.ativo !== usuario.ativo) mudancas.ativo = dados.ativo;
  const empresa = calcularMudancasEmpresa(dados.empresa, usuario.empresa);
  if (empresa) mudancas.empresa = empresa;
  return mudancas;
}

function FormEditarUsuario({ usuario, ehVoceMesmo, aoCancelar, aoSalvar, aoMudarOcupado }) {
  const [dados, setDados] = useState(() => dadosIniciais(usuario));
  const [errosCampo, setErrosCampo] = useState({});
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [definindoSenha, setDefinindoSenha] = useState(false);

  const alterar = (campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const alterarEmpresa = (campo, valor) =>
    setDados((atual) => ({ ...atual, empresa: { ...atual.empresa, [campo]: valor } }));

  function mudarSalvando(valor) {
    setSalvando(valor);
    aoMudarOcupado(valor);
  }

  function mudarDefinindoSenha(valor) {
    setDefinindoSenha(valor);
    aoMudarOcupado(valor);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro(null);

    const erros = validarContato(dados);
    if (usuario.empresa) {
      const errosEmpresa = validarEmpresa(dados.empresa);
      if (Object.keys(errosEmpresa).length > 0) erros.empresa = errosEmpresa;
    }
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) return;

    const mudancas = calcularMudancas(dados, usuario, ehVoceMesmo);
    if (Object.keys(mudancas).length === 0) {
      aoCancelar();
      return;
    }

    mudarSalvando(true);
    try {
      const salvo = await atualizarUsuario(usuario.id, mudancas);
      const encerrouSessoes = mudancas.perfil !== undefined || mudancas.ativo === false;
      mudarSalvando(false);
      aoSalvar(
        salvo,
        `Alterações em ${salvo.nome} salvas.${encerrouSessoes ? ' As sessões abertas dessa conta foram encerradas.' : ''}`,
      );
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (falha.codigo === 'CPF_EM_USO') porCampo.cpf = falha.message;
      setErrosCampo({ ...porCampo, empresa: errosDaEmpresa(falha, porCampo) });
      setErro(falha.message);
      mudarSalvando(false);
    }
  }

  return (
    <>
      <form onSubmit={salvar} noValidate className="space-y-4">
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        {usuario.empresa && (
          <CamposEmpresa dados={dados.empresa} erros={errosCampo.empresa} aoMudar={alterarEmpresa} cnpjFixo />
        )}
        <Campo
          rotulo={usuario.empresa ? 'Nome do responsável' : 'Nome completo'}
          autoComplete="off"
          maxLength={150}
          value={dados.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          erro={errosCampo.nome}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="CPF"
            opcional
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={dados.cpf}
            onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
            erro={errosCampo.cpf}
          />
          <Campo
            rotulo="Telefone"
            opcional
            type="tel"
            autoComplete="off"
            placeholder="(48) 99999-0000"
            value={dados.telefone}
            onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
            erro={errosCampo.telefone}
          />
        </div>
        <SeletorPerfil
          valor={dados.perfil}
          aoMudar={(perfil) => alterar('perfil', perfil)}
          erro={errosCampo.perfil}
          desabilitado={ehVoceMesmo}
          dica={ehVoceMesmo ? 'Você não pode mudar o seu próprio perfil.' : undefined}
        />
        <div className="flex items-start gap-3">
          <input
            id="usuario-ativo"
            type="checkbox"
            checked={dados.ativo}
            disabled={ehVoceMesmo}
            onChange={(e) => alterar('ativo', e.target.checked)}
            aria-describedby="usuario-ativo-dica"
            className="mt-1 size-4 accent-marca"
          />
          <div>
            <label htmlFor="usuario-ativo" className="font-bold">
              Conta ativa
            </label>
            <p id="usuario-ativo-dica" className="text-sm text-suave">
              {ehVoceMesmo
                ? 'Você não pode desativar a sua própria conta.'
                : 'Desativada, a pessoa não consegue entrar, mas o histórico dela continua guardado.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Botao variante="secundario" onClick={aoCancelar} disabled={salvando || definindoSenha}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={salvando} textoCarregando="Salvando…" disabled={definindoSenha}>
            Salvar alterações
          </Botao>
        </div>
      </form>

      <FormRedefinirSenha
        usuario={usuario}
        desabilitado={salvando}
        aoMudarOcupado={mudarDefinindoSenha}
        aoDefinir={(mensagem) => aoSalvar(usuario, mensagem)}
      />
    </>
  );
}

export default function ModalEditarUsuario({ usuario, ehVoceMesmo, aoFechar, aoSalvar }) {
  const [ocupado, setOcupado] = useState(false);

  return (
    <Modal
      aberto={Boolean(usuario)}
      titulo={usuario ? `Editar ${usuario.nome}` : 'Editar usuário'}
      descricao={usuario?.email}
      aoFechar={() => !ocupado && aoFechar()}
    >
      {usuario && (
        <FormEditarUsuario
          key={usuario.id}
          usuario={usuario}
          ehVoceMesmo={ehVoceMesmo}
          aoCancelar={aoFechar}
          aoSalvar={aoSalvar}
          aoMudarOcupado={setOcupado}
        />
      )}
    </Modal>
  );
}
