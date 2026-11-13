import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/modulos/auth/AuthContext';
import { itensVisiveis } from '@/compartilhado/config/navegacao';
import { useTema } from '@/compartilhado/hooks/useTema';
import SeloPerfil from '@/compartilhado/componentes/SeloPerfil';
import Botao from '@/compartilhado/componentes/Botao';
import BotaoTema from '@/compartilhado/componentes/BotaoTema';

const estiloLinkMenu = ({ isActive }) =>
  `inline-block border-b-2 px-3 py-3 text-sm font-bold whitespace-nowrap ${
    isActive ? 'border-marca text-marca' : 'border-transparent text-suave hover:text-texto'
  }`;

export default function LayoutApp() {
  const { usuario, sair } = useAuth();
  const { tema, alternarTema } = useTema();
  const [saindo, setSaindo] = useState(false);

  async function aoSair() {
    setSaindo(true);
    await sair();
  }

  return (
    <div className="min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-superficie focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>

      <header className="border-b border-borda bg-superficie">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-marca">
            <img
              src={tema === 'escuro' ? '/simbolo-abadeus-clara.png' : '/simbolo-abadeus.png'}
              alt=""
              width="32"
              height="32"
            />
            <span>Espaços ABADEUS</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-48 truncate font-bold sm:inline" title={usuario.email}>
              {usuario.nome}
            </span>
            <SeloPerfil perfil={usuario.perfil} />
            <BotaoTema tema={tema} aoAlternar={alternarTema} />
            <Botao variante="secundario" onClick={aoSair} carregando={saindo} textoCarregando="Saindo…">
              Sair
            </Botao>
          </div>
        </div>

        <nav aria-label="Principal" className="border-t border-borda">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
            {itensVisiveis(usuario.perfil).map((item) => (
              <li key={item.para}>
                <NavLink to={item.para} end={item.para === '/'} className={estiloLinkMenu}>
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-8" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
