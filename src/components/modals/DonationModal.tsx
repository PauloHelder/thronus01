import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Donation } from '../../types';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (donation: Omit<Donation, 'id'> | Donation) => void;
    donation?: Donation;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, onSave, donation }) => {
    const [formData, setFormData] = useState<Omit<Donation, 'id'>>({
        donorName: '',
        amount: 0,
        date: '',
        fund: 'Dízimo',
        method: 'Dinheiro',
    });

    useEffect(() => {
        if (donation) {
            setFormData({
                donorName: donation.donorName,
                donorAvatar: donation.donorAvatar,
                amount: donation.amount,
                date: donation.date,
                fund: donation.fund,
                method: donation.method,
            });
        } else {
            setFormData({
                donorName: '',
                amount: 0,
                date: '',
                fund: 'Dízimo',
                method: 'Dinheiro',
            });
        }
    }, [donation, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: donation?.id || crypto.randomUUID(),
            donorAvatar: formData.donorAvatar || `https://i.pravatar.cc/150?u=${formData.donorName}`,
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={donation ? 'Editar Contribuição' : 'Nova Contribuição'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Doador</label>
                        <input
                            type="text"
                            required
                            value={formData.donorName}
                            onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Nome completo"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (Kz)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contribuição</label>
                            <select
                                value={formData.fund}
                                onChange={(e) => setFormData({ ...formData, fund: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Dízimo">Dízimo</option>
                                <option value="Oferta">Oferta</option>
                                <option value="Missões">Missões</option>
                                <option value="Construção">Construção</option>
                                <option value="Eventos">Eventos</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pagamento</label>
                            <select
                                value={formData.method}
                                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Transferência">Transferência</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Cartão">Cartão</option>
                                <option value="PIX">PIX</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40"
                    >
                        {donation ? 'Salvar Alterações' : 'Registrar Contribuição'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DonationModal;
