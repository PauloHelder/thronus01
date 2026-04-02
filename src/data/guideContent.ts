import { 
  Users, 
  Layout, 
  Calendar, 
  Smartphone, 
  DollarSign, 
  GraduationCap, 
  ShieldCheck, 
  Building, 
  Package, 
  BarChart3, 
  Shield, 
  CreditCard, 
  Settings,
  BookOpen
} from 'lucide-react';

export interface GuideSection {
  id: string;
  title: string;
  icon: any;
  content: string[];
}

export const guideContent: GuideSection[] = [
  {
    id: 'intro',
    title: 'Bem-vindo ao Thronus',
    icon: BookOpen,
    content: [
      'O Thronus é a sua plataforma moderna de gestão eclesiástica, concebida para ajudar líderes e administradores a gerir as suas igrejas com eficiência e transparência.',
      'Nesta guia interativa, aprenderá a navegar em cada módulo do sistema.'
    ]
  },
  {
    id: 'registration',
    title: '1. Cadastro e Vinculação',
    icon: ShieldCheck,
    content: [
      '**Processo de Cadastro**: O registo da igreja é feito em três etapas rápidas: Dados Básicos, Localização e Contactos/Senha.',
      '**Código de Vinculação**: Após o cadastro, o sistema gera um código único. Este código é essencial para vincular a sua congregação a uma "Igreja Mãe" ou sede, permitindo a supervisão em rede.'
    ]
  },
  {
    id: 'get-started',
    title: '2. Acesso ao Sistema',
    icon: Layout,
    content: [
      '**Login**: Aceda com o seu e-mail e palavra-passe definidos no cadastro.',
      '**Perfil da Igreja**: No menu lateral, em "Perfil da Igreja", pode atualizar logótipo, endereço e contactos oficiais.',
      '**Dashboard**: Visualize a saúde da igreja em tempo real com métricas de Membros, Novos Convertidos, Grupos Ativos e Saldo de SMS.'
    ]
  },
  {
    id: 'members',
    title: '3. Gestão de Membros',
    icon: Users,
    content: [
      '**Adicionar Membros**: Registe dados pessoais, datas de batismo e contactos de forma individual.',
      '**Importação Excel**: Adicione membros em massa descarregando o arquivo modelo e importando-o preenchido.',
      '**Filtros Avançados**: Pesquise por nome, código, funções, batizados, estado civil, sexo ou data de nascimento para encontrar informações específicas rapidamente.'
    ]
  },
  {
    id: 'groups',
    title: '4. Grupos e Células',
    icon: Users,
    content: [
      '**Criação de Grupos**: Defina líderes, tipo de grupo e horários de reunião.',
      '**Membros**: Associe membros a grupos para facilitar o acompanhamento pastoral.',
      '**Encontros**: Registe a frequência e o impacto espiritual de cada reunião do grupo.'
    ]
  },
  {
    id: 'services',
    title: '5. Serviços e Cultos',
    icon: Calendar,
    content: [
      '**Estatísticas de Culto**: Registe o número de adultos, crianças e visitantes em cada serviço.',
      '**Novos Convertidos**: Acompanhe o número de pessoas que aceitaram a fé.',
      '**Relatórios**: Analise a média de assistência e crescimento ao longo do tempo.'
    ]
  },
  {
    id: 'finance',
    title: '6. Gestão Financeira',
    icon: DollarSign,
    content: [
      '**Entradas e Saídas**: Controle dízimos, ofertas, doações e todas as despesas da congregação.',
      '**Saldo e Origens**: Acompanhe o saldo atual e identifique se as finanças provêm de cultos, eventos ou outras fontes.',
      '**Requisições**: Organize todas as requisições de fundos e orçamentos para um planeamento financeiro rigoroso.',
      '**Categorização**: Organize os lançamentos para relatórios financeiros detalhados e assembleias.'
    ]
  },
  {
    id: 'teaching',
    title: '7. Ensino',
    icon: GraduationCap,
    content: [
      '**Turmas e Classes**: Crie classes para a EBD ou cursos de formação bíblica.',
      '**Gestão de Alunos**: Registe presenças e acompanhe a assiduidade dos membros nas aulas.'
    ]
  },
  {
    id: 'discipleship',
    title: '8. Discipulado',
    icon: BookOpen,
    content: [
      '**Discipuladores**: Cadastre líderes de discipulado e adicione os discípulos que cada um irá acompanhar.',
      '**Encontros**: Faça a gestão das reuniões individuais de acompanhamento espiritual com cada discípulo.'
    ]
  },
  {
    id: 'departments',
    title: '9. Departamentos e Ministérios',
    icon: Building,
    content: [
      '**Organização**: Gira áreas como Louvor, Jovens e Senhores.',
      '**Membros e Escalas**: Adicione membros aos departamentos e faça a gestão automática das escalas de serviço.',
      '**Objetivos**: Defina e acompanhe as metas e objetivos de cada departamento.'
    ]
  },
  {
    id: 'assets',
    title: '10. Gestão de Património (Assets)',
    icon: Package,
    content: [
      '**Inventário**: Registe equipamentos, instrumentos e imóveis com categorias e localização.',
      '**Manutenção**: Acompanhe o estado de conservação de cada item e planeie as datas de manutenção necessárias.'
    ]
  },
  {
    id: 'events',
    title: '11. Eventos e Calendário',
    icon: Calendar,
    content: [
      '**Agenda**: Crie conferências, retiros e atividades especiais com horários e preletores.',
      '**Inscrições**: Acompanhe em tempo real a lista de membros interessados em participar nos eventos.'
    ]
  },
  {
    id: 'sms',
    title: '12. Mensagens SMS',
    icon: Smartphone,
    content: [
      '**Comunicação**: Envie alertas e notificações rápidas para a sua congregação.',
      '**Loja**: Adquira pacotes de SMS facilitados via pagamento por IBAN.',
      '**Saldo**: Verifique o seu saldo atual no Dashboard ou na seção de SMS.'
    ]
  },
  {
    id: 'users',
    title: '13. Usuários e Permissões',
    icon: Shield,
    content: [
      '**Equipa**: Adicione líderes ou funcionários ao sistema administrative.',
      '**Níveis de Acesso**: Defina permissões granulares para que cada pessoa veja apenas o necessário (ex: Tesoureiro vê apenas Finanças).',
      '**Segurança**: Monitorização de ações para garantir a integridade dos dados da igreja.'
    ]
  },
  {
    id: 'subscription',
    title: '14. Assinatura e Uso do Plano',
    icon: CreditCard,
    content: [
      '**Monitorização**: Verifique o consumo de membros e recursos do seu plano em tempo real.',
      '**Upgrade**: Solicite a migração para planos superiores diretamente pelo sistema quando a igreja crescer.'
    ]
  },
  {
    id: 'settings',
    title: '15. Configurações',
    icon: Settings,
    content: [
      '**Personalização**: Mantenha os dados de contacto, morada e redes sociais sempre atualizados.',
      '**Marca**: Em breve será possível personalizar logótipos e cores oficiais da igreja no sistema.'
    ]
  }
];
