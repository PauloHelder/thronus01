import { TransactionCategory } from '../types';

export const MOCK_CATEGORIES: TransactionCategory[] = [
    { id: '1', name: 'Dízimos', type: 'Income', isSystem: true },
    { id: '2', name: 'Ofertas', type: 'Income', isSystem: true },
    { id: '3', name: 'Doações Especiais', type: 'Income', isSystem: false },
    { id: '4', name: 'Aluguel', type: 'Expense', isSystem: false },
    { id: '5', name: 'Energia Elétrica', type: 'Expense', isSystem: false },
    { id: '6', name: 'Água', type: 'Expense', isSystem: false },
    { id: '7', name: 'Salários', type: 'Expense', isSystem: false },
    { id: '8', name: 'Manutenção', type: 'Expense', isSystem: false },
    { id: '9', name: 'Missões', type: 'Expense', isSystem: false },
];
