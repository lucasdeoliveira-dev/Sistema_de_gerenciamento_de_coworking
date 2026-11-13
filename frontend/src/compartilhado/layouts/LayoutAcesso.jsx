import { Outlet } from 'react-router-dom';

export default function LayoutAcesso() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col border-r border-borda bg-painel p-10 text-texto lg:flex">
        <img src="/logo-abadeus.png" alt="ABADEUS" className="h-16 w-auto self-start" />
        <p className="my-auto text-3xl leading-tight font-bold">Coworking, laboratórios e salas em um só lugar.</p>
      </aside>

      <main id="conteudo" className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <img src="/logo-abadeus.png" alt="ABADEUS" className="mb-8 h-10 w-auto lg:hidden" />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
