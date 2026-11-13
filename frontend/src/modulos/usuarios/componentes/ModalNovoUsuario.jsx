import { useState } from 'react';
import { criarUsuario } from '@/modulos/usuarios/api';
import { validarContato } from '@/modulos/usuarios/validacao';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { PERFIS } from '@/compartilhado/config/perfis';
import { TIPOS_PESSOA } from '@/compartilhado/config/tiposPessoa';
import {
  emailValido,
  mascaraCpf,
  mascaraTelefone,
  senhaForte,
  somenteDigitos,
  vazioParaNull,
} from '@/compartilhado/utils/formatos';
import { EMPRESA_VAZIA, empresaParaApi, errosDaEmpresa, validarEmpresa } from '@/compartilhado/utils/empresa';
import Modal from '@/compartilhado/componentes/Modal';
import Campo from '@/compartilhado/componentes/Campo';
import CampoSenha from '@/compartilhado/componentes/CampoSenha';
import CamposEmpresa from '@/compartilhado/componentes/CamposEmpresa';
import SeletorTipoPessoa from '@/compartilhado/componentes/SeletorTipoPessoa';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';
import SeletorPerfil from '@/modulos/usuarios/componentes/SeletorPerfil';

const VAZIO = {
  tipoPessoa: TIPOS_PESSOA.FISICA,
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  perfil: PERFIS.SOLICITANTE,
  senha: '',
  empresa: EMPRESA_VAZIA,
};

function FormNovoUsuario({ aoCancelar, aoCriar, aoMudarOcupado }) {
  const [dados, setDados] = useState(VAZIO);
  const [errosCampo, setErrosCampo] = useState({});
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const juridica = dados.tipoPessoa === TIPOS_PESSOA.JURIDICA;

  const alterar = (campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const alterarEmpresa = (campo, valor) =>
    setDados((atual) => ({ ...atual, empresa: { ...atual.empresa, [campo]: valor } }));

  function mudarSalvando(valor) {
    setSalvando(valor);
    aoMudarOcupado(valor);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro(null);

    const erros = validarContato(dados);
    if (!emailValido(dados.email)) erros.email = 'Informe um e-mail válido.';
    if (!senhaForte(dados.senha)) erros.senha = 'A senha provisória ainda não atende a todos os requisitos.';
    if (juridica) {
      const errosEmpresa = validarEmpresa(dados.empresa);
      if (Object.keys(errosEmpresa).length > 0) erros.empresa = errosEmpresa;
    }
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) return;

    mudarSalvando(true);
    try {
      const criado = await criarUsuario({
        tipoPessoa: dados.tipoPessoa,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        cpf: dados.cpf ? somenteDigitos(dados.cpf) : null,
        telefone: vazioParaNull(dados.telefone),
        perfil: dados.perfil,
        senha: dados.senha,
        ...(juridica && { empresa: empresaParaApi(dados.empresa) }),
      });
      mudarSalvando(false);
      aoCriar(criado);
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (falha.codigo === 'EMAIL_EM_USO') porCampo.email = falha.message;
      if (falha.codigo === 'CPF_EM_USO') porCampo.cpf = falha.message;
      setErrosCampo({ ...porCampo, empresa: errosDaEmpresa(falha, porCampo) });
      setErro(falha.message);
      mudarSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-4">
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      <SeletorTipoPessoa valor={dados.tipoPessoa} aoMudar={(tipo) => alterar('tipoPessoa', tipo)} />
      {juridica && (
        <CamposEmpresa
          dados={dados.empresa}
          erros={errosCampo.empresa}
          aoMudar={alterarEmpresa}
          dicaCnpj="Se a empresa já estiver cadastrada, a conta é vinculada a ela."
        />
      )}
      <Campo
        rotulo={juridica ? 'Nome do responsável' : 'Nome completo'}
        autoComplete="off"
        maxLength={150}
        value={dados.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        erro={errosCampo.nome}
      />
      <Campo
        rotulo="E-mail"
        type="email"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        value={dados.email}
        onChange={(e) => alterar('email', e.target.value)}
        erro={errosCampo.email}
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
      <SeletorPerfil valor={dados.perfil} aoMudar={(perfil) => alterar('perfil', perfil)} erro={errosCampo.perfil} />
      <CampoSenha
        rotulo="Senha provisória"
        autoComplete="new-password"
        value={dados.senha}
        onChange={(e) => alterar('senha', e.target.value)}
        erro={errosCampo.senha}
        mostrarRequisitos
      />
      <div className="flex justify-end gap-3">
        <Botao variante="secundario" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando} textoCarregando="Criando…">
          Criar usuário
        </Botao>
      </div>
    </form>
  );
}

export default function ModalNovoUsuario({ aberto, aoFechar, aoCriar }) {
  const [ocupado, setOcupado] = useState(false);

  return (
    <Modal aberto={aberto} titulo="Novo usuário" aoFechar={() => !ocupado && aoFechar()}>
      <FormNovoUsuario aoCancelar={aoFechar} aoCriar={aoCriar} aoMudarOcupado={setOcupado} />
    </Modal>
  );
}
