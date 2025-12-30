import React, { useState } from 'react';
import { Check, X, Calendar, CreditCard } from 'lucide-react';
import { Plan, Subscription } from '../types';
import { usePlans } from '../hooks/usePlans';

const ChurchSubscription: React.FC = () => {
    const { plans, loading } = usePlans();
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [duration, setDuration] = useState<1 | 3 | 6 | 12>(1);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Mock current subscription
    const currentSubscription: Subscription | null = {
        id: '1',
        churchId: 'demo-church-1',
        planId: 'free',
        duration: 1,
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        status: 'active',
        totalAmount: 0,
    };

    const currentPlan = plans.find(p => p.id === currentSubscription?.planId);

    const calculateEndDate = (startDate: Date, months: number): string => {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);
        return endDate.toISOString().split('T')[0];
    };

    const calculateTotal = (plan: Plan, months: number): number => {
        return plan.price * months;
    };

    const handleSubscribe = (plan: Plan) => {
        if (currentSubscription?.status === 'active' && currentSubscription.planId === plan.id) {
            // Extend current subscription
            setSelectedPlan(plan);
            setShowPaymentModal(true);
        } else {
            // New subscription
            setSelectedPlan(plan);
            setShowPaymentModal(true);
        }
    };

    const formatValue = (value: number | 'unlimited') => {
        return value === 'unlimited' ? 'Ilimitado' : value;
    };

    const getPlanColor = (planName: string) => {
        switch (planName) {
            case 'Free': return 'from-gray-50 to-gray-100 border-gray-200';
            case 'Profissional': return 'from-blue-50 to-blue-100 border-blue-200';
            case 'Premium': return 'from-purple-50 to-purple-100 border-purple-200';
            default: return 'from-gray-50 to-gray-100 border-gray-200';
        }
    };

    const getPlanBadgeColor = (planName: string) => {
        switch (planName) {
            case 'Free': return 'bg-gray-100 text-gray-700';
            case 'Profissional': return 'bg-blue-100 text-blue-700';
            case 'Premium': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const isCurrentPlan = (planId: string) => {
        return currentSubscription?.planId === planId && currentSubscription?.status === 'active';
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando planos...</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Planos e Assinaturas</h1>
                <p className="text-slate-600 mt-1">Escolha o melhor plano para sua igreja</p>
            </div>

            {/* Current Subscription */}
            {currentSubscription && currentPlan && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-orange-900 mb-1">Plano Atual</h3>
                            <p className="text-orange-700">
                                <span className="font-semibold">{currentPlan.name}</span> -
                                Válido até {new Date(currentSubscription.endDate).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-sm text-orange-600 mt-1">
                                Status: <span className="font-medium capitalize">{currentSubscription.status === 'active' ? 'Ativo' : currentSubscription.status}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-orange-900">
                                {currentPlan.price.toLocaleString('pt-BR')} Kz
                            </p>
                            <p className="text-sm text-orange-700">por mês</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrent = isCurrentPlan(plan.id);

                    return (
                        <div
                            key={plan.id}
                            className={`bg-gradient-to-br ${getPlanColor(plan.name)} rounded-xl border p-6 ${isCurrent ? 'ring-2 ring-orange-500' : ''
                                }`}
                        >
                            {/* Plan Header */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(plan.name)}`}>
                                        {plan.name}
                                    </span>
                                    {isCurrent && (
                                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                                            Atual
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-slate-800">
                                        {plan.price.toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-slate-600">Kz/{plan.billing_period === 'monthly' ? 'mês' : plan.billing_period}</span>
                                </div>
                            </div>

                            {/* Features List - Compact */}
                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex items-center gap-2">
                                    {plan.features.canLinkToSupervision ? (
                                        <Check className="text-green-600 flex-shrink-0" size={16} />
                                    ) : (
                                        <X className="text-red-400 flex-shrink-0" size={16} />
                                    )}
                                    <span className="text-slate-700">Vincular a Supervisão</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {plan.features.customBranding ? (
                                        <Check className="text-green-600 flex-shrink-0" size={16} />
                                    ) : (
                                        <X className="text-red-400 flex-shrink-0" size={16} />
                                    )}
                                    <span className="text-slate-700">Personalizar Marca</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Check className="text-green-600 flex-shrink-0" size={16} />
                                    <span className="text-slate-700">
                                        {formatValue(plan.features.maxMembers)} membros
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Check className="text-green-600 flex-shrink-0" size={16} />
                                    <span className="text-slate-700">
                                        {formatValue(plan.features.maxGroups)} grupos
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {plan.features.exportStatistics ? (
                                        <Check className="text-green-600 flex-shrink-0" size={16} />
                                    ) : (
                                        <X className="text-red-400 flex-shrink-0" size={16} />
                                    )}
                                    <span className="text-slate-700">Exportar Estatísticas</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {plan.features.exportFinances ? (
                                        <Check className="text-green-600 flex-shrink-0" size={16} />
                                    ) : (
                                        <X className="text-red-400 flex-shrink-0" size={16} />
                                    )}
                                    <span className="text-slate-700">Exportar Finanças</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={isCurrent && plan.price === 0}
                                className={`w-full py-3 rounded-lg font-medium transition-colors ${isCurrent
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                    : 'bg-white hover:bg-gray-50 text-slate-700 border border-slate-300'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isCurrent ? 'Estender Assinatura' : 'Assinar Plano'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">
                            {isCurrentPlan(selectedPlan.id) ? 'Estender Assinatura' : 'Nova Assinatura'}
                        </h3>

                        <div className="mb-6">
                            <p className="text-sm text-slate-600 mb-2">Plano selecionado:</p>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-semibold text-slate-800">{selectedPlan.name}</p>
                                <p className="text-sm text-slate-600">
                                    {selectedPlan.price.toLocaleString('pt-BR')} Kz/mês
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Duração da Assinatura
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 6, 12].map((months) => (
                                    <button
                                        key={months}
                                        onClick={() => setDuration(months as 1 | 3 | 6 | 12)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${duration === months
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {months} {months === 1 ? 'mês' : 'meses'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={16} className="text-blue-600" />
                                <p className="text-sm font-medium text-blue-900">Período da Assinatura</p>
                            </div>
                            <p className="text-sm text-blue-700">
                                Início: {new Date().toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-sm text-blue-700">
                                Término: {new Date(calculateEndDate(new Date(), duration)).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-900">Total a Pagar:</span>
                                <span className="text-2xl font-bold text-green-900">
                                    {calculateTotal(selectedPlan, duration).toLocaleString('pt-BR')} Kz
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    alert('Funcionalidade de pagamento será implementada');
                                    setShowPaymentModal(false);
                                }}
                                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <CreditCard size={16} />
                                Pagar Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChurchSubscription;
