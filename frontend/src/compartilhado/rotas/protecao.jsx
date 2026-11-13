import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/modulos/auth/AuthContext';
import TelaCarregando from '@/compartilhado/componentes/TelaCarregando';
import AcessoNegado from '@/compartilhado/paginas/AcessoNegado';
import { destinoSeguro } from '@/compartilhado/utils/destinoSeguro';

export function RotaProtegida({ perfis, children }) {
  const { usuario, carregando, saida } = useAuth();
  const local = useLocation();

  if (carregando) return <TelaCarregando />;

  if (!usuario) {
    if (saida) {
      return <Navigate to={saida.aviso ? `/entrar?aviso=${encodeURIComponent(saida.aviso)}` : '/entrar'} replace />;
    }
    const voltar = encodeURIComponent(local.pathname + local.search);
    return <Navigate to={`/entrar?voltar=${voltar}`} replace />;
  }

  if (perfis && !perfis.includes(usuario.perfil)) return <AcessoNegado />;

  return children ?? <Outlet />;
}

export function RotaVisitante({ children }) {
  const { usuario, carregando } = useAuth();
  const [parametros] = useSearchParams();
  if (carregando) return <TelaCarregando />;
  if (usuario) return <Navigate to={destinoSeguro(parametros.get('voltar'))} replace />;
  return children ?? <Outlet />;
}
