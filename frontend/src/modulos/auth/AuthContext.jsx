import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authApi from '@/modulos/auth/api';
import { definirAoPerderSessao } from '@/compartilhado/api/cliente';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuarioEstado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [sessaoEncerrada, setSessaoEncerrada] = useState(false);
  const [saida, setSaida] = useState(null);
  const usuarioRef = useRef(null);

  const setUsuario = useCallback((novo) => {
    usuarioRef.current = novo;
    setUsuarioEstado(novo);
  }, []);

  useEffect(() => {
    definirAoPerderSessao(() => {
      if (usuarioRef.current) setSessaoEncerrada(true);
      setUsuario(null);
    });

    let ativo = true;
    authApi
      .obterEu()
      .then((eu) => ativo && setUsuario(eu))
      .catch(() => ativo && setUsuario(null))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
      definirAoPerderSessao(null);
    };
  }, [setUsuario]);

  const entrar = useCallback(
    async (email, senha) => {
      const { usuario: logado } = await authApi.entrar(email, senha);
      setSessaoEncerrada(false);
      setSaida(null);
      setUsuario(logado);
      return logado;
    },
    [setUsuario],
  );

  const sair = useCallback(async () => {
    try {
      await authApi.sair();
    } finally {
      setSessaoEncerrada(false);
      setSaida({ aviso: null });
      setUsuario(null);
    }
  }, [setUsuario]);

  const esquecerSessao = useCallback(
    (aviso = null) => {
      setSessaoEncerrada(false);
      setSaida({ aviso });
      setUsuario(null);
    },
    [setUsuario],
  );

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      sessaoEncerrada,
      saida,
      entrar,
      sair,
      esquecerSessao,
      atualizarUsuario: setUsuario,
    }),
    [usuario, carregando, sessaoEncerrada, saida, entrar, sair, esquecerSessao, setUsuario],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
