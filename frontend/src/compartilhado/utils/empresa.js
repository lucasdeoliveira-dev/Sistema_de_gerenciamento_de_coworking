import { cnpjValido, mascaraCnpj, normalizarCnpj, vazioParaNull } from '@/compartilhado/utils/formatos';

export const EMPRESA_VAZIA = { cnpj: '', razaoSocial: '', nomeFantasia: '' };

export function empresaParaFormulario(empresa) {
  if (!empresa) return EMPRESA_VAZIA;
  return {
    cnpj: mascaraCnpj(empresa.cnpj),
    razaoSocial: empresa.razao_social,
    nomeFantasia: empresa.nome_fantasia ?? '',
  };
}

export function validarEmpresa(dados) {
  const erros = {};
  if (!cnpjValido(dados.cnpj)) erros.cnpj = 'CNPJ inválido. Confira os números e as letras.';
  if (dados.razaoSocial.trim().length < 2) erros.razaoSocial = 'Informe a razão social.';
  const fantasia = dados.nomeFantasia.trim();
  if (fantasia && fantasia.length < 2) erros.nomeFantasia = 'Nome fantasia muito curto.';
  return erros;
}

export const empresaParaApi = (dados) => ({
  cnpj: normalizarCnpj(dados.cnpj),
  razaoSocial: dados.razaoSocial.trim(),
  nomeFantasia: vazioParaNull(dados.nomeFantasia),
});

export function errosDaEmpresa(falha, porCampo) {
  return {
    cnpj: falha.codigo === 'CNPJ_EM_USO' ? falha.message : porCampo['empresa.cnpj'],
    razaoSocial: porCampo['empresa.razaoSocial'],
    nomeFantasia: porCampo['empresa.nomeFantasia'],
  };
}
