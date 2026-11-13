import { Route, Routes } from 'react-router-dom';
import { RotaProtegida, RotaVisitante } from '@/compartilhado/rotas/protecao';
import { PERFIS } from '@/compartilhado/config/perfis';
import LayoutAcesso from '@/compartilhado/layouts/LayoutAcesso';
import LayoutApp from '@/compartilhado/layouts/LayoutApp';
import Entrar from '@/modulos/auth/paginas/Entrar';
import Cadastro from '@/modulos/auth/paginas/Cadastro';
import EsqueciSenha from '@/modulos/auth/paginas/EsqueciSenha';
import RedefinirSenha from '@/modulos/auth/paginas/RedefinirSenha';
import MeuPerfil from '@/modulos/auth/paginas/MeuPerfil';
import Usuarios from '@/modulos/usuarios/paginas/Usuarios';
import Inicio from '@/compartilhado/paginas/Inicio';
import NaoEncontrado from '@/compartilhado/paginas/NaoEncontrado';

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutAcesso />}>
        <Route element={<RotaVisitante />}>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        </Route>
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      </Route>

      <Route element={<RotaProtegida />}>
        <Route element={<LayoutApp />}>
          <Route index element={<Inicio />} />
          <Route path="meu-perfil" element={<MeuPerfil />} />
          <Route element={<RotaProtegida perfis={[PERFIS.ADMIN]} />}>
            <Route path="admin/usuarios" element={<Usuarios />} />
          </Route>
          <Route path="*" element={<NaoEncontrado />} />
        </Route>
      </Route>
    </Routes>
  );
}
