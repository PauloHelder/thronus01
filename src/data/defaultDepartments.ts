import { Department } from '../types';

// Departamentos padrão que toda igreja deve ter ao ser criada
export const getDefaultDepartments = (): Omit<Department, 'id' | 'leaderId' | 'coLeaderId' | 'leader' | 'coLeader'>[] => [
    {
        name: 'Secretaria',
        icon: 'Clipboard',
        description: 'Responsável pela organização administrativa, documentação e atendimento.',
        members: [],
        schedules: [],
        isDefault: true
    },
    {
        name: 'Finanças',
        icon: 'Calculator',
        description: 'Gestão financeira, tesouraria, dízimos e ofertas.',
        members: [],
        schedules: [],
        isDefault: true
    },
    {
        name: 'Louvor',
        icon: 'Music',
        description: 'Ministério de música e louvor nos cultos e eventos.',
        members: [],
        schedules: [],
        isDefault: true
    }
];
