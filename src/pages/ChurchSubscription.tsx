import React, { useState } from 'react';
import { Check, X, Calendar, CreditCard, Users, Building, ShieldCheck, BookOpen, UserPlus, Info, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Plan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { useSubscriptionUsage } from '../hooks/useSubscriptionUsage';

export const ResourceUsageBar: React.FC<{
  label: string;
  current: number;
  limit: number | 'unlimited';
  icon: React.ReactNode;
}> = ({ label, current, limit, icon }) => {
  const isUnlimited = limit === 'unlimited';
  const percentage = isUnlimited ? 0 : Math.min(Math.round((current / (limit as number)) * 100), 100);
  
  const getStatusColor = () => {
    if (isUnlimited) return 'bg-green-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
            {icon}
          </div>
          <span className="font-semibold text-slate-700 text-sm">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-slate-900">{current}</span>
          <span className="text-xs text-slate-400 ml-1">
            / {isUnlimited ? '∞' : limit}
          </span>
        </div>
      </div>
      
      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStatusColor()} transition-all duration-500`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider">
            <span className={percentage >= 90 ? 'text-red-500' : 'text-slate-400'}>
              {percentage >= 90 ? 'Limite Atingido' : `${percentage}% Consumido`}
            </span>
          </div>
        </div>
      )}
      
      {isUnlimited && (
        <div className="flex items-center gap-2 text-[9px] text-green-600 font-bold uppercase tracking-wider">
          <CheckCircle2 size={10} />
          Uso Ilimitado
        </div>
      )}
    </div>
  );
};

const ChurchSubscription: React.FC = () => {
    const { hasPermission } = useAuth();
    const { plans, loading: loadingPlans } = usePlans();
    const { data: usageData, loading: loadingUsage, error: usageError } = useSubscriptionUsage();
    
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [duration, setDuration] = useState<1 | 3 | 6 | 12>(1);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [viewMode, setViewMode] = useState<'usage' | 'plans'>('usage');

    if (!hasPermission('subscription_view') && !hasPermission('all')) {
        return (
            <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para gerenciar a assinatura desta igreja.</p>
            </div>
        );
    }

    const calculateEndDate = (startDate: Date, months: number): string => {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);
        return endDate.toISOString().split('T')[0];
    };

    const calculateTotal = (plan: Plan, months: number): number => {
        return plan.price * months;
    };

    const handleSubscribe = (plan: Plan) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
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
        return usageData?.plan.id === planId;
    };

    if (loadingPlans || loadingUsage) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Carregando informações da assinatura...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <ShieldCheck className="text-orange-600" size={32} />
                        Assinatura e Uso
                    </h1>
                    <p className="text-slate-600 mt-1">Gerencie seu plano e visualize o consumo da sua igreja</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => setViewMode('usage')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'usage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Visão de Uso
                    </button>
                    <button 
                        onClick={() => setViewMode('plans')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'plans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Alterar Plano
                    </button>
                </div>
            </div>

            {usageError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertTriangle size={20} />
                    <p className="text-sm font-medium">Aviso: A função de contagem em tempo real ainda não foi ativada no banco de dados. Contate o administrador.</p>
                </div>
            )}

            {viewMode === 'usage' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Current Plan Summary Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CreditCard size={150} />
                        </div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/30">
                                    PLANO ATUAL
                                </span>
                                <h2 className="text-4xl font-black mt-4">{usageData?.plan.name || 'Buscando...'}</h2>
                                <div className="mt-6 flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar size={18} className="text-orange-500" />
                                        <span className="text-sm">Vence em: {usageData?.plan.expires_at ? new Date(usageData.plan.expires_at).toLocaleDateString('pt-BR') : 'Consultar Admin'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Info size={18} className="text-orange-500" />
                                        <span className="text-sm">Bónus Mensal: <strong>{usageData?.plan.features.smsBonus || 0} SMS</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-md-end">
                                <button 
                                    onClick={() => setViewMode('plans')}
                                    className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-orange-50 transition-all flex items-center gap-2"
                                >
                                    Fazer Upgrade <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Usage Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ResourceUsageBar 
                            label="Membros Ativos" 
                            current={usageData?.usage.members || 0} 
                            limit={usageData?.plan.features.maxMembers || 0} 
                            icon={<Users size={20} />} 
                        />
                        <ResourceUsageBar 
                            label="Células / Grupos" 
                            current={usageData?.usage.groups || 0} 
                            limit={usageData?.plan.features.maxGroups || 0} 
                            icon={<Building size={20} />} 
                        />
                        <ResourceUsageBar 
                            label="Líderes e Cargos" 
                            current={usageData?.usage.leaders || 0} 
                            limit={usageData?.plan.features.maxLeaders || 0} 
                            icon={<ShieldCheck size={20} />} 
                        />
                        <ResourceUsageBar 
                            label="Discípulos" 
                            current={usageData?.usage.disciples || 0} 
                            limit={usageData?.plan.features.maxDisciples || 0} 
                            icon={<UserPlus size={20} />} 
                        />
                        <ResourceUsageBar 
                            label="Departamentos" 
                            current={usageData?.usage.departments || 0} 
                            limit={usageData?.plan.features.maxDepartments || 0} 
                            icon={<Info size={20} />} 
                        />
                        <ResourceUsageBar 
                            label="Turmas e Classes" 
                            current={usageData?.usage.classes || 0} 
                            limit={usageData?.plan.features.maxClasses || 0} 
                            icon={<BookOpen size={20} />} 
                        />
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrent = isCurrentPlan(plan.id);

                            return (
                                <div
                                    key={plan.id}
                                    className={`bg-gradient-to-br ${getPlanColor(plan.name)} rounded-2xl border p-8 flex flex-col ${isCurrent ? 'ring-2 ring-orange-500 shadow-xl' : 'shadow-sm'
                                        }`}
                                >
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPlanBadgeColor(plan.name)}`}>
                                                {plan.name}
                                            </span>
                                            {isCurrent && (
                                                <div className="flex items-center gap-1 text-orange-600 font-bold text-xs uppercase">
                                                    <CheckCircle2 size={14} /> Ativo
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-slate-800">
                                                {plan.price.toLocaleString('pt-BR')}
                                            </span>
                                            <span className="text-slate-500 font-medium">Kz/mês</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10 flex-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Membros Suportados</span>
                                            <span className="font-bold text-slate-800">{formatValue(plan.features.maxMembers)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Grupos / Células</span>
                                            <span className="font-bold text-slate-800">{formatValue(plan.features.maxGroups)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 text-orange-600 font-bold">Bónus de SMS Mensal</span>
                                            <span className="font-bold text-orange-600">{plan.features.smsBonus || 0}</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Check className="text-green-500" size={16} />
                                                <span className="text-xs text-slate-600">Estatísticas em Tempo Real</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {plan.features.customBranding ? (
                                                     <Check className="text-green-500" size={16} />
                                                ) : (
                                                     <X className="text-slate-400" size={16} />
                                                )}
                                                <span className="text-xs text-slate-600">Marca Personalizada</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={isCurrent && plan.price === 0}
                                        className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${isCurrent
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                                            }`}
                                    >
                                        {isCurrent ? 'Plano Atual' : 'Migrar para este Plano'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Note Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex gap-4 mt-8">
                <Info className="text-slate-400 shrink-0" size={24} />
                <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>Gestão de Limites:</strong> O Thronus monitora o seu uso em tempo real. Ao atingir o limite de um recurso, novas entradas serão bloqueadas automaticamente. Para suporte adicional ou planos customizados acima do Premium, entre em contato com o suporte técnico.
                </p>
            </div>

            {/* Payment Modal (Reused) */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-800">
                                {isCurrentPlan(selectedPlan.id) ? 'Estender Plano' : 'Assinar Plano'}
                            </h3>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">PLANO SELECIONADO</p>
                                <p className="text-xl font-black text-slate-800">{selectedPlan.name}</p>
                                <p className="text-sm font-bold text-orange-600">{selectedPlan.price.toLocaleString('pt-BR')} Kz / mês</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    PERÍODO DA ASSINATURA
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[1, 3, 6, 12].map((months) => (
                                        <button
                                            key={months}
                                            onClick={() => setDuration(months as 1 | 3 | 6 | 12)}
                                            className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${duration === months
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                }`}
                                        >
                                            {months} {months === 1 ? 'mês' : 'meses'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-green-800">Total a Pagar:</span>
                            <span className="text-2xl font-black text-green-900">
                                {calculateTotal(selectedPlan, duration).toLocaleString('pt-BR')} Kz
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                alert('Aguardando confirmação do pagamento pelo Super Admin.');
                                setShowPaymentModal(false);
                            }}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
                        >
                            <CreditCard size={20} />
                            Confirmar Assinatura
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChurchSubscription;
