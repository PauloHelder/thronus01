export interface Church {
    id: string;
    name: string;
    denomination: string;
    pastorName: string;
    email: string;
    phone: string;
    address: string;
    memberCount: number;
    status: 'Active' | 'Inactive' | 'Pending';
    joinedAt: string;
}

export const MOCK_CHURCHES: Church[] = [
    {
        id: 'demo-user-1', // Correlates with demo user ID
        name: 'Demo Church',
        denomination: 'Evangélica',
        pastorName: 'Demo User',
        email: 'demo@church.com',
        phone: '+1234567890',
        address: 'Rua Exemplo, 123, Luanda',
        memberCount: 1204,
        status: 'Active',
        joinedAt: '2023-01-15'
    },
    {
        id: 'church-2',
        name: 'Igreja Vida Nova',
        denomination: 'Batista',
        pastorName: 'Pastor João',
        email: 'contato@vidanova.com',
        phone: '+244 923 456 789',
        address: 'Av. Brasil, 456, Luanda',
        memberCount: 350,
        status: 'Active',
        joinedAt: '2023-03-10'
    },
    {
        id: 'church-3',
        name: 'Comunidade da Graça',
        denomination: 'Pentecostal',
        pastorName: 'Pastora Maria',
        email: 'graca@comunidade.com',
        phone: '+244 912 345 678',
        address: 'Rua da Paz, 789, Benguela',
        memberCount: 85,
        status: 'Pending',
        joinedAt: '2023-11-05'
    },
    {
        id: 'church-4',
        name: 'Catedral da Esperança',
        denomination: 'Metodista',
        pastorName: 'Bispo Pedro',
        email: 'contato@catedralesperanca.ao',
        phone: '+244 934 567 890',
        address: 'Largo da Independência, Luanda',
        memberCount: 2500,
        status: 'Active',
        joinedAt: '2022-06-20'
    }
];
