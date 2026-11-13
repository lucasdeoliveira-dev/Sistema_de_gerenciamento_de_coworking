import { PERFIS } from '@/compartilhado/config/perfis';

export const MENU = [
  { rotulo: 'Início', para: '/', perfis: null },
  {
    rotulo: 'Usuários',
    para: '/admin/usuarios',
    perfis: [PERFIS.ADMIN],
    descricao: 'Criar contas da equipe, definir perfis e desativar quem não usa mais o sistema.',
  },
  {
    rotulo: 'Meu perfil',
    para: '/meu-perfil',
    perfis: null,
    descricao: 'Atualizar seus dados, trocar a senha e ver em quais aparelhos você está conectado.',
  },
];

export const AREAS_EM_CONSTRUCAO = [
  {
    rotulo: 'Espaços e disponibilidade',
    descricao: 'Coworking, laboratórios e salas, com os horários de funcionamento.',
    responsavel: 'Samuel',
  },
  {
    rotulo: 'Reservas',
    descricao: 'Pedir um horário, aceitar o termo de uso e acompanhar os pedidos.',
    responsavel: 'Davi',
  },
  {
    rotulo: 'Aprovação e acesso',
    descricao: 'Aprovar ou recusar pedidos, QR Code de entrada e registro de saída.',
    responsavel: 'Victor',
  },
  {
    rotulo: 'Cadastros e relatórios',
    descricao: 'Empresas, recursos e estoque, relatórios de uso.',
    responsavel: 'André',
  },
];

export const itensVisiveis = (perfil) => MENU.filter((item) => !item.perfis || item.perfis.includes(perfil));
