import React, { useState } from 'react';
import { Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePlans } from '../hooks/usePlans';

const Plans: React.FC = () => {
    const { plans, loading } = usePlans();

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

    if (loading) {
        return <div className="p-8 text-center">Carregando planos...</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Planos Disponíveis</h1>
                    <p className="text-slate-600 mt-1">Visão geral dos planos do sistema</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <p className="text-blue-600 text-sm font-medium">Total de Planos</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">{plans.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <p className="text-green-600 text-sm font-medium">Planos Ativos</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">
                        {plans.filter(p => p.is_active).length}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <p className="text-purple-600 text-sm font-medium">Plano Mais Caro</p>
                    <p className="text-3xl font-bold text-purple-700 mt-1">
                        {Math.max(...plans.map(p => p.price)).toLocaleString('pt-BR')} Kz
                    </p>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-gradient-to-br ${getPlanColor(plan.name)} rounded-xl border p-6 relative`}
                    >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium">
                                {plan.is_active ? (
                                    <>
                                        <ToggleRight className="text-green-600" size={20} />
                                        <span className="text-green-700">Ativo</span>
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="text-gray-400" size={20} />
                                        <span className="text-gray-500">Inativo</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Plan Header */}
                        <div className="mb-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(plan.name)} mb-3`}>
                                {plan.name}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-800">
                                    {plan.price.toLocaleString('pt-BR')}
                                </span>
                                <span className="text-slate-600">Kz/{plan.billing_period === 'monthly' ? 'mês' : plan.billing_period}</span>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Vincular a Supervisão</span>
                                {plan.features.canLinkToSupervision ? (
                                    <Check className="text-green-600" size={18} />
                                ) : (
                                    <X className="text-red-400" size={18} />
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Ser Vinculada</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.canBeLinked)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Personalizar Marca</span>
                                {plan.features.customBranding ? (
                                    <Check className="text-green-600" size={18} />
                                ) : (
                                    <X className="text-red-400" size={18} />
                                )}
                            </div>

                            <div className="border-t border-slate-300 my-3"></div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Membros</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.maxMembers)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Grupos</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.maxGroups)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Líderes</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.maxLeaders)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Discípulos</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.maxDisciples)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Departamentos</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.maxDepartments)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Turmas</span>
                                <span className="font-medium text-slate-800">
                                    {formatValue(plan.features.maxClasses)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Eventos</span>
                                <span className="font-medium text-slate-800">
                                    {plan.features.maxEvents}
                                </span>
                            </div>

                            <div className="border-t border-slate-300 my-3"></div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Estatísticas de Cultos</span>
                                {plan.features.serviceStatistics ? (
                                    <Check className="text-green-600" size={18} />
                                ) : (
                                    <X className="text-red-400" size={18} />
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Exportar Estatísticas</span>
                                {plan.features.exportStatistics ? (
                                    <Check className="text-green-600" size={18} />
                                ) : (
                                    <X className="text-red-400" size={18} />
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">Exportar Finanças</span>
                                {plan.features.exportFinances ? (
                                    <Check className="text-green-600" size={18} />
                                ) : (
                                    <X className="text-red-400" size={18} />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Esta é uma visualização dos planos disponíveis no sistema. O gerenciamento é feito no painel Super Admin.
                </p>
            </div>
        </div>
    );
};

export default Plans;
