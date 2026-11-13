import { mascaraCnpj } from '@/compartilhado/utils/formatos';
import Campo from '@/compartilhado/componentes/Campo';

export default function CamposEmpresa({ dados, erros = {}, aoMudar, cnpjFixo = false, dicaCnpj }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-borda bg-fundo p-4">
      <legend className="px-1 text-sm font-bold">Dados da empresa</legend>
      <Campo
        rotulo="CNPJ"
        name="cnpj"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="00.000.000/0000-00"
        value={dados.cnpj}
        onChange={(e) => aoMudar('cnpj', mascaraCnpj(e.target.value))}
        erro={erros.cnpj}
        dica={cnpjFixo ? 'O CNPJ não pode ser alterado.' : dicaCnpj}
        disabled={cnpjFixo}
      />
      <Campo
        rotulo="Razão social"
        name="razao-social"
        autoComplete="organization"
        maxLength={150}
        value={dados.razaoSocial}
        onChange={(e) => aoMudar('razaoSocial', e.target.value)}
        erro={erros.razaoSocial}
      />
      <Campo
        rotulo="Nome fantasia"
        opcional
        name="nome-fantasia"
        autoComplete="off"
        maxLength={150}
        value={dados.nomeFantasia}
        onChange={(e) => aoMudar('nomeFantasia', e.target.value)}
        erro={erros.nomeFantasia}
      />
    </fieldset>
  );
}
