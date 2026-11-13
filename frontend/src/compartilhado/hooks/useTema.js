import { useEffect, useState } from 'react';

const CHAVE = 'sgec-tema';

function temaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
  } catch {
    return 'claro';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

function salvarTema(tema) {
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    return;
  }
}

export function useTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.tema = tema;
    return () => {
      delete raiz.dataset.tema;
    };
  }, [tema]);

  function alternarTema() {
    const novo = tema === 'escuro' ? 'claro' : 'escuro';
    salvarTema(novo);
    setTema(novo);
  }

  return { tema, alternarTema };
}
