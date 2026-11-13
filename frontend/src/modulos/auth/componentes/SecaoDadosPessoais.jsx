import { useState } from 'react';
import { useAuth } from '@/modulos/auth/AuthContext';
import { atualizarEu } from '@/modulos/auth/api';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { NOMES_TIPO_PESSOA } from '@/compartilhado/config/tiposPessoa';
import { cpfValido, mascaraCpf, mascaraTelefone, somenteDigitos, vazioParaNull } from '@/compartilhado/utils/formatos';
import { empresaParaFormulario, errosDaEmpresa, validarEmpresa } from '@/compartilhado/utils/empresa';
import Secao from '@/compartilhado/componentes/Secao';
import Campo from '@/compartilhado/componentes/Campo';
import CamposEmpresa from '@/compartilhado/componentes/CamposEmpresa';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';
import SeloPerfil from '@/compartilhado/componentes/SeloPerfil';

function dadosIniciais(usuario) {
  return {
    nome: usuario.nome,
    cpf: usuario.cpf ? mascaraCpf(usuario.cpf) : '',
    telefone: usuario.telefone ? mascaraTelefone(usuario.telefone) : '',
    empresa: empresaParaFormulario(usuario.empresa),
  };
}

function validar(dados, temEmpresa) {
  const erros = {};
  if (dados.nome.trim().length < 2) erros.nome = 'Informe o seu nome completo.';
  if (dados.cpf && !cpfValido(dados.cpf)) erros.cpf = 'CPF inválido. Confira os números.';
  if (dados.telefone && somenteDigitos(dados.telefone).length < 10) erros.telefone = 'Informe o DDD e o número.';
  if (temEmpresa) {
    const errosEmpresa = validarEmpresa(dados.empresa);
    if (Object.keys(errosEmpresa).length > 0) erros.empresa = errosEmpresa;
  }
  return erros;
}

export default function SecaoDadosPessoais() {
  const { usuario, atualizarUsuario } = useAuth();
  const [dados, setDados] = useState(() => dadosIniciais(usuario));
  const [errosCampo, setErrosCampo] = useState({});
  const [retorno, setRetorno] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const temEmpresa = Boolean(usuario.empresa);

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setRetorno(null);
  }

  function alterarEmpresa(campo, valor) {
    setDados((atual) => ({ ...atual, empresa: { ...atual.empresa, [campo]: valor } }));
    setRetorno(null);
  }

  async function salvar(evento) {
    evento.preventDefault();

    const erros = validar(dados, temEmpresa);
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    try {
      const atualizado = await atualizarEu({
        nome: dados.nome.trim(),
        cpf: dados.cpf ? somenteDigitos(dados.cpf) : null,
        telefone: vazioParaNull(dados.telefone),
        ...(temEmpresa && {
          empresa: {
            razaoSocial: dados.empresa.razaoSocial.trim(),
            nomeFantasia: vazioParaNull(dados.empresa.nomeFantasia),
          },
        }),
      });
      atualizarUsuario(atualizado);
      setRetorno({ tipo: 'sucesso', texto: 'Dados salvos.' });
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (falha.codigo === 'CPF_EM_USO') porCampo.cpf = falha.message;
      setErrosCampo({ ...porCampo, empresa: errosDaEmpresa(falha, porCampo) });
      setRetorno({ tipo: 'erro', texto: falha.message });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Dados pessoais" descricao="Para mudar o e-mail ou o perfil, fale com um administrador.">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-suave">E-mail</dt>
          <dd className="font-bold break-all">{usuario.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-suave">Perfil</dt>
          <dd>
            <SeloPerfil perfil={usuario.perfil} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-suave">Tipo de conta</dt>
          <dd className="font-bold">{NOMES_TIPO_PESSOA[usuario.tipo_pessoa]}</dd>
        </div>
      </dl>

      <form onSubmit={salvar} noValidate className="space-y-4">
        {temEmpresa && (
          <CamposEmpresa dados={dados.empresa} erros={errosCampo.empresa} aoMudar={alterarEmpresa} cnpjFixo />
        )}
        <Campo
          rotulo={temEmpresa ? 'Nome do responsável' : 'Nome completo'}
          name="nome"
          autoComplete="name"
          maxLength={150}
          value={dados.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          erro={errosCampo.nome}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="CPF"
            opcional
            name="cpf"
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
            name="telefone"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(48) 99999-0000"
            value={dados.telefone}
            onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
            erro={errosCampo.telefone}
          />
        </div>
        {retorno && <Alerta tipo={retorno.tipo}>{retorno.texto}</Alerta>}
        <div className="flex justify-end">
          <Botao type="submit" carregando={salvando} textoCarregando="Salvando…">
            Salvar dados
          </Botao>
        </div>
      </form>
    </Secao>
  );
}
