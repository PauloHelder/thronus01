import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: any;
  onUpdate: () => void;
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, plan, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    billing_period: 'monthly',
    features: {
      canLinkToSupervision: false,
      canBeLinked: 0,
      customBranding: false,
      maxMembers: 50,
      maxGroups: 5,
      maxLeaders: 5,
      maxDisciples: 10,
      maxDepartments: 3,
      maxClasses: 3,
      maxEvents: 10,
      serviceStatistics: false,
      exportStatistics: false,
      exportFinances: false
    }
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price: plan.price,
        billing_period: plan.billing_period,
        features: {
          ...formData.features,
          ...plan.features
        }
      });
    } else {
      // Reset for new plan
      setFormData({
        name: '',
        price: 0,
        billing_period: 'monthly',
        features: {
          canLinkToSupervision: false,
          canBeLinked: 0,
          customBranding: false,
          maxMembers: 50,
          maxGroups: 5,
          maxLeaders: 5,
          maxDisciples: 10,
          maxDepartments: 3,
          maxClasses: 3,
          maxEvents: 10,
          serviceStatistics: false,
          exportStatistics: false,
          exportFinances: false
        }
      });
    }
  }, [plan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const dataToSave = {
        name: formData.name,
        price: formData.price,
        billing_period: formData.billing_period,
        features: formData.features
      };

      let error;
      if (plan) {
        const { error: updateError } = await supabase
          .from('plans')
          .update(dataToSave)
          .eq('id', plan.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('plans')
          .insert([dataToSave]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(plan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast.error('Erro ao salvar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-800">
            {plan ? 'Editar Plano' : 'Novo Plano'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="plan-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Profissional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preço (Akz)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ciclo de Cobrança
                </label>
                <select
                  value={formData.billing_period}
                  onChange={e => setFormData({ ...formData, billing_period: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="semiannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-slate-800 mb-4">Limites e Recursos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Numeric Limits */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Membros</label>
                    <input
                      type="number"
                      value={formData.features.maxMembers}
                      onChange={e => handleFeatureChange('maxMembers', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Células/Grupos</label>
                    <input
                      type="number"
                      value={formData.features.maxGroups}
                      onChange={e => handleFeatureChange('maxGroups', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Líderes</label>
                    <input
                      type="number"
                      value={formData.features.maxLeaders}
                      onChange={e => handleFeatureChange('maxLeaders', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Discípulos</label>
                    <input
                      type="number"
                      value={formData.features.maxDisciples}
                      onChange={e => handleFeatureChange('maxDisciples', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Departamentos</label>
                    <input
                      type="number"
                      value={formData.features.maxDepartments}
                      onChange={e => handleFeatureChange('maxDepartments', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Classes de Ensino</label>
                    <input
                      type="number"
                      value={formData.features.maxClasses}
                      onChange={e => handleFeatureChange('maxClasses', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Eventos</label>
                    <input
                      type="number"
                      value={formData.features.maxEvents}
                      onChange={e => handleFeatureChange('maxEvents', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Boolean Toggles */}
              <div className="mt-6 space-y-3">
                 <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.features.serviceStatistics}
                      onChange={e => handleFeatureChange('serviceStatistics', e.target.checked)}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Estatísticas de Cultos</span>
                 </label>

                 <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.features.exportStatistics}
                      onChange={e => handleFeatureChange('exportStatistics', e.target.checked)}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Exportar Estatísticas</span>
                 </label>

                 <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.features.exportFinances}
                      onChange={e => handleFeatureChange('exportFinances', e.target.checked)}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Exportar Finanças</span>
                 </label>
                 
                 <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.features.customBranding}
                      onChange={e => handleFeatureChange('customBranding', e.target.checked)}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Custom Branding (Logo Própria)</span>
                 </label>
              </div>

            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="plan-form"
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
                <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Salvando...
                </>
            ) : (
                <>
                    <Check size={18} />
                    {plan ? 'Salvar Alterações' : 'Criar Plano'}
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;
