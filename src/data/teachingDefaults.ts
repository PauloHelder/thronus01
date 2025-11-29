import { ChristianStage, TeachingCategory } from '../types';

// Estágios padrão da carreira cristã
export const DEFAULT_CHRISTIAN_STAGES: ChristianStage[] = [
    { id: '1', name: 'Acolher', description: 'Recepção de novos convertidos', order: 1 },
    { id: '2', name: 'Firmar', description: 'Consolidação da fé', order: 2 },
    { id: '3', name: 'Formar', description: 'Formação de discípulos', order: 3 },
    { id: '4', name: 'Capacitar', description: 'Capacitação para o serviço', order: 4 },
];

// Categorias padrão de turmas
export const DEFAULT_TEACHING_CATEGORIES: TeachingCategory[] = [
    { id: '1', name: 'Homogenia', description: 'Turmas mistas' },
    { id: '2', name: 'Adultos', description: 'Turmas para adultos' },
    { id: '3', name: 'Jovens', description: 'Turmas para jovens' },
    { id: '4', name: 'Líderes', description: 'Formação de líderes' },
    { id: '5', name: 'Casais', description: 'Turmas para casais' },
    { id: '6', name: 'Crianças', description: 'Turmas infantis' },
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
