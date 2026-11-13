import Campo, { ESTILO_ENTRADA } from '@/compartilhado/componentes/Campo';

export default function CampoSelecao({ rotulo, erro, dica, opcoes, className, ...props }) {
  return (
    <Campo rotulo={rotulo} erro={erro} dica={dica} className={className}>
      {(acessibilidade) => (
        <select {...acessibilidade} className={ESTILO_ENTRADA} {...props}>
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      )}
    </Campo>
  );
}
