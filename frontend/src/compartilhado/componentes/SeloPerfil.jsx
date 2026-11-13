import { NOMES_PERFIS } from '@/compartilhado/config/perfis';

const CORES = {
  ADMIN: 'bg-marca text-contraste',
  GESTOR: 'bg-marca-clara text-marca',
  RECEPCAO: 'bg-aviso-fundo text-aviso',
  SOLICITANTE: 'bg-fundo text-suave ring-1 ring-borda',
};

export default function SeloPerfil({ perfil }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${CORES[perfil] ?? CORES.SOLICITANTE}`}>
      {NOMES_PERFIS[perfil] ?? perfil}
    </span>
  );
}
