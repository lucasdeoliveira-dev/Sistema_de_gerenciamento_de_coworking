import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modulos/auth/AuthContext';
import { cadastrar } from '@/modulos/auth/api';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { TIPOS_PESSOA } from '@/compartilhado/config/tiposPessoa';
import {
  cpfValido,
  emailValido,
  mascaraCpf,
  mascaraTelefone,
  senhaForte,
  somenteDigitos,
  vazioParaNull,
} from '@/compartilhado/utils/formatos';
import { EMPRESA_VAZIA, empresaParaApi, errosDaEmpresa, validarEmpresa } from '@/compartilhado/utils/empresa';
import Campo from '@/compartilhado/componentes/Campo';
import CampoSenha from '@/compartilhado/componentes/CampoSenha';
import CamposEmpresa from '@/compartilhado/componentes/CamposEmpresa';
import SeletorTipoPessoa from '@/compartilhado/componentes/SeletorTipoPessoa';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';

const VAZIO = {
  tipoPessoa: TIPOS_PESSOA.FISICA,
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  senha: '',
  confirmacao: '',
  empresa: EMPRESA_VAZIA,
};

function validar(dados) {
  const erros = {};
  if (dados.nome.trim().length < 2) erros.nome = 'Informe o seu nome completo.';
  if (!emailValido(dados.email)) erros.email = 'Informe um e-mail válido.';
  if (dados.cpf && !cpfValido(dados.cpf)) erros.cpf = 'CPF inválido. Confira os números.';
  if (dados.telefone && somenteDigitos(dados.telefone).length < 10) erros.telefone = 'Informe o DDD e o número.';
  if (!senhaForte(dados.senha)) erros.senha = 'A senha ainda não atende a todos os requisitos.';
  if (dados.confirmacao !== dados.senha) erros.confirmacao = 'As senhas não são iguais.';
  if (dados.tipoPessoa === TIPOS_PESSOA.JURIDICA) {
    const errosEmpresa = validarEmpresa(dados.empresa);
    if (Object.keys(errosEmpresa).length > 0) erros.empresa = errosEmpresa;
  }
  return erros;
}

export default function Cadastro() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [dados, setDados] = useState(VAZIO);
  const [errosCampo, setErrosCampo] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const juridica = dados.tipoPessoa === TIPOS_PESSOA.JURIDICA;

  const alterar = (campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const alterarEmpresa = (campo, valor) =>
    setDados((atual) => ({ ...atual, empresa: { ...atual.empresa, [campo]: valor } }));

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);

    const erros = validar(dados);
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) {
      setErro('Corrija os campos destacados para continuar.');
      return;
    }

    setEnviando(true);
    try {
      await cadastrar({
        tipoPessoa: dados.tipoPessoa,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        cpf: dados.cpf ? somenteDigitos(dados.cpf) : null,
        telefone: vazioParaNull(dados.telefone),
        senha: dados.senha,
        ...(juridica && { empresa: empresaParaApi(dados.empresa) }),
      });
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (falha.codigo === 'EMAIL_EM_USO') porCampo.email = falha.message;
      if (falha.codigo === 'CPF_EM_USO') porCampo.cpf = falha.message;
      setErrosCampo({ ...porCampo, empresa: errosDaEmpresa(falha, porCampo) });
      setErro(falha.message);
      setEnviando(false);
      return;
    }

    try {
      await entrar(dados.email.trim(), dados.senha);
    } catch {
      navigate('/entrar?aviso=conta-criada', { replace: true });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <p className="mt-1 text-suave">Com a conta você consulta os horários livres e pede reservas dos espaços.</p>
      </div>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <form onSubmit={enviar} noValidate className="space-y-4">
        <SeletorTipoPessoa valor={dados.tipoPessoa} aoMudar={(tipo) => alterar('tipoPessoa', tipo)} />

        {juridica && <CamposEmpresa dados={dados.empresa} erros={errosCampo.empresa} aoMudar={alterarEmpresa} />}

        <Campo
          rotulo={juridica ? 'Nome do responsável' : 'Nome completo'}
          name="nome"
          autoComplete="name"
          value={dados.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          erro={errosCampo.nome}
          maxLength={150}
          required
        />
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={dados.email}
          onChange={(e) => alterar('email', e.target.value)}
          erro={errosCampo.email}
          maxLength={254}
          required
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
        <CampoSenha
          rotulo="Senha"
          name="nova-senha"
          autoComplete="new-password"
          value={dados.senha}
          onChange={(e) => alterar('senha', e.target.value)}
          erro={errosCampo.senha}
          mostrarRequisitos
          required
        />
        <CampoSenha
          rotulo="Repita a senha"
          name="confirmacao"
          autoComplete="new-password"
          value={dados.confirmacao}
          onChange={(e) => alterar('confirmacao', e.target.value)}
          erro={errosCampo.confirmacao}
          required
        />
        <Botao type="submit" carregando={enviando} textoCarregando="Criando conta…" className="w-full">
          Criar conta
        </Botao>
      </form>

      <p className="text-center text-sm text-suave">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-bold text-marca hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
