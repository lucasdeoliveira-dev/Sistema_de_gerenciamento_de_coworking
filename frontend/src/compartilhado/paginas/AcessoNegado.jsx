import { Link } from 'react-router-dom';

export default function AcessoNegado() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-3xl font-bold">Esta área não está disponível para o seu perfil</h1>
      <p className="mt-2 text-suave">
        Se você precisa deste acesso, peça a um administrador para revisar o seu perfil.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-marca px-4 py-2.5 font-bold text-contraste hover:bg-marca-escura"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
