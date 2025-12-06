import { ChristianStage, TeachingCategory } from '../types';

// Estágios padrão da carreira cristã
export const DEFAULT_CHRISTIAN_STAGES: ChristianStage[] = [
    { id: '1', name: 'Novo Convertido', description: 'Primeiros passos na fé', order: 1 },
    { id: '2', name: 'Acolher', description: 'Recepção de novos convertidos', order: 2 },
    { id: '3', name: 'Firmar', description: 'Consolidação da fé', order: 3 },
    { id: '4', name: 'Formar', description: 'Formação de discípulos', order: 4 },
    { id: '5', name: 'Capacitar', description: 'Capacitação para o serviço', order: 5 },
];

// Categorias padrão de turmas
export const DEFAULT_TEACHING_CATEGORIES: TeachingCategory[] = [
    { id: '1', name: 'Geral', description: 'Turmas gerais' },
    { id: '2', name: 'Homogenia', description: 'Turmas mistas' },
    { id: '3', name: 'Adultos', description: 'Turmas para adultos' },
    { id: '4', name: 'Jovens', description: 'Turmas para jovens' },
    { id: '5', name: 'Líderes', description: 'Formação de líderes' },
    { id: '6', name: 'Casais', description: 'Turmas para casais' },
    { id: '7', name: 'Crianças', description: 'Turmas infantis' },
];

export const DAYS_OF_WEEK = [
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
    'Domingo'
] as const;
