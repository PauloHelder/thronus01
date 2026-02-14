import React, { useState, useEffect } from 'react';
import { X, Save, Wallet, Building, TrendingUp } from 'lucide-react';
import { FinancialAccount } from '../../hooks/useFinance';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: any) => Promise<boolean>;
    account?: FinancialAccount;
}

const AccountModal: React.FC<AccountModalProps> = ({
    isOpen,
    onClose,
    onSave,
    account
}) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'bank',
        initial_balance: '0',
        is_active: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name,
                type: account.type,
                initial_balance: account.initial_balance.toString(),
                is_active: account.is_active
            });
        } else {
            setFormData({
                name: '',
                type: 'bank',
                initial_balance: '0',
                is_active: true
            });
        }
    }, [account, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.name) {
                throw new Error('O nome da conta é obrigatório.');
            }

            const newInitial = parseFloat(formData.initial_balance);
            let payload: any = {
                ...formData,
                initial_balance: newInitial
            };

            if (account) {
                // Ajustar o saldo atual proporcionalmente à mudança no saldo inicial
                const diff = newInitial - account.initial_balance;
                payload.current_balance = account.current_balance + diff;
            } else {
                // Para nova conta, saldo inicial = saldo atual
                payload.current_balance = newInitial;
            }

            const success = await onSave(payload);

            if (success) {
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getThemeColor = (type: string) => {
        switch (type) {
            case 'bank': return 'blue';
            case 'cash': return 'green';
            case 'investment': return 'purple';
            default: return 'gray';
        }
    };

    const themeColor = getThemeColor(formData.type);

    // Dynamic classes based on theme
    const headerClass = `bg-${themeColor}-50 border-${themeColor}-100`;
    const titleClass = `text-${themeColor}-700`;
    const buttonSelectedClass = `border-${themeColor}-500 bg-${themeColor}-50 text-${themeColor}-700 ring-1 ring-${themeColor}-500`;
    const submitButtonClass = `bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:ring-${themeColor}-500`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-all">
                <div className={`flex items-center justify-between p-4 border-b ${headerClass}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/50 text-${themeColor}-600`}>
                            {formData.type === 'bank' && <Building size={20} />}
                            {formData.type === 'cash' && <Wallet size={20} />}
                            {formData.type === 'investment' && <TrendingUp size={20} />}
                        </div>
                        <h2 className={`text-lg font-bold ${titleClass}`}>
                            {account ? 'Editar Conta' : 'Nova Conta'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Tipo de Conta */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Conta</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'bank' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${formData.type === 'bank' ? buttonSelectedClass : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <Building size={24} className="mb-2" />
                                <span className="text-xs font-bold">Banco</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'cash' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${formData.type === 'cash' ? buttonSelectedClass : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <Wallet size={24} className="mb-2" />
                                <span className="text-xs font-bold">Caixa</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'investment' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${formData.type === 'investment' ? buttonSelectedClass : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <TrendingUp size={24} className="mb-2" />
                                <span className="text-xs font-bold">Investimento</span>
                            </button>
                        </div>
                    </div>

                    {/* Nome da Conta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                            style={{ borderColor: 'var(--tw-ring-color)' }} // Fallback styling
                            placeholder="Ex: Banco BAI, Caixa Pequeno..."
                        />
                    </div>

                    {/* Saldo Inicial */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (Kz)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Kz</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.initial_balance}
                                onChange={e => setFormData({ ...formData, initial_balance: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                                placeholder="0,00"
                            />
                        </div>
                        {account && (
                            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                Ao alterar o saldo inicial, o saldo atual será ajustado proporcionalmente.
                            </p>
                        )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="toggle"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-4 checked:border-white"
                                style={{ top: '4px', left: '4px' }}
                            />
                            <label
                                htmlFor="is_active"
                                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${formData.is_active ? `bg-${themeColor}-500` : 'bg-gray-300'
                                    }`}
                            ></label>
                        </div>
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                            {formData.is_active ? 'Conta Ativa' : 'Conta Inativa'}
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-lg shadow-sm transition-all transform active:scale-95 ${submitButtonClass} ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
