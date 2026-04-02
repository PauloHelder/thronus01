import React from 'react';
import { useSubscriptionUsage } from '../hooks/useSubscriptionUsage';
import { CreditCard, Users, Building, ShieldCheck, Calendar, BookOpen, UserPlus, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

const ResourceUsageBar: React.FC<{
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
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
            {icon}
          </div>
          <span className="font-semibold text-slate-700">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-900">{current}</span>
          <span className="text-sm text-slate-400 ml-1">
            / {isUnlimited ? '∞' : limit}
          </span>
        </div>
      </div>
      
      {!isUnlimited && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStatusColor()} transition-all duration-500`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
            <span className={percentage >= 90 ? 'text-red-500' : 'text-slate-400'}>
              {percentage >= 90 ? 'Limite Atingido' : `${percentage}% Consumido`}
            </span>
            {percentage >= 90 && <AlertTriangle size={12} className="text-red-500" />}
          </div>
        </div>
      )}
      
      {isUnlimited && (
        <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold uppercase tracking-wider">
          <CheckCircle2 size={12} />
          Uso Ilimitado
        </div>
      )}
    </div>
  );
};

const SubscriptionManagement: React.FC = () => {
  const { data, loading, error } = useSubscriptionUsage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Calculando uso do plano...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
        <AlertTriangle />
        <p>Erro ao carregar dados da assinatura: {error || 'Dados não encontrados'}</p>
      </div>
    );
  }

  const { plan, usage } = data;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <ShieldCheck className="text-orange-600" size={32} />
          Assinatura e Uso
        </h1>
        <p className="text-slate-500 mt-1">Gerencie seu plano e visualize o consumo de recursos da sua igreja.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plan Details Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard size={120} />
          </div>
          <div className="relative z-10">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/30">
              PLANO ATUAL
            </span>
            <h2 className="text-4xl font-black mt-4">{plan.name}</h2>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar size={18} />
                <span className="text-sm">Expira em: <strong className="text-white">{plan.expires_at ? new Date(plan.expires_at).toLocaleDateString('pt-AO') : 'Vitalício'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Info size={18} />
                <span className="text-sm">Bónus mensal: <strong className="text-white">{plan.features.smsBonus} SMS</strong></span>
              </div>
            </div>
            <button className="w-full mt-10 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all shadow-xl shadow-black/20">
              Solicitar Upgrade
            </button>
          </div>
        </div>

        {/* Resource Usage Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResourceUsageBar 
            label="Membros Ativos" 
            current={usage.members} 
            limit={plan.features.maxMembers} 
            icon={<Users size={20} />} 
          />
          <ResourceUsageBar 
            label="Grupos/Células" 
            current={usage.groups} 
            limit={plan.features.maxGroups} 
            icon={<Building size={20} />} 
          />
          <ResourceUsageBar 
            label="Líderes e Cargos" 
            current={usage.leaders} 
            limit={plan.features.maxLeaders} 
            icon={<ShieldCheck size={20} />} 
          />
          <ResourceUsageBar 
            label="Discípulos" 
            current={usage.disciples} 
            limit={plan.features.maxDisciples} 
            icon={<UserPlus size={20} />} 
          />
          <ResourceUsageBar 
            label="Departamentos" 
            current={usage.departments} 
            limit={plan.features.maxDepartments} 
            icon={<Info size={20} />} 
          />
          <ResourceUsageBar 
            label="Turmas de Ensino" 
            current={usage.classes} 
            limit={plan.features.maxClasses} 
            icon={<BookOpen size={20} />} 
          />
        </div>
      </div>
      
      {/* Note about Billing */}
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-4">
        <Info className="text-orange-500 shrink-0" size={24} />
        <div>
          <p className="text-sm font-bold text-orange-900">Sobre o seu plano</p>
          <p className="text-xs text-orange-700 leading-relaxed mt-1">
            As contagens de recursos são atualizadas em tempo real. Se você atingir o limite de um recurso (como Membros), 
            o sistema impedirá novas adições até que você migre para um plano superior ou remova registros inativos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
