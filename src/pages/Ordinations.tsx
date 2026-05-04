import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdinations } from '../hooks/useOrdinations';
import { useMembers } from '../hooks/useMembers';
import { Award, Calendar, User, Users, Plus, Trash2, ChevronRight, Search, Loader2 } from 'lucide-react';
import OrdinationModal from '../components/modals/OrdinationModal';
import { toast } from 'sonner';

const Ordinations: React.FC = () => {
  const navigate = useNavigate();
  const { ordinations, loading, addOrdination, deleteOrdination } = useOrdinations();
  const { members } = useMembers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrdinations = ordinations.filter(o => 
    o.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.celebrant?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddOrdination = async (data: any) => {
    const success = await addOrdination(data);
    if (success) {
      toast.success('Consagração registrada com sucesso!');
      setIsModalOpen(false);
    } else {
      toast.error('Erro ao registrar consagração');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este registro de consagração? (Isso não alterará o cargo atual dos membros)')) {
      const success = await deleteOrdination(id);
      if (success) toast.success('Registro excluído com sucesso');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Consagrações</h1>
          <p className="text-slate-600 mt-1">Histórico de ordenações e consagrações da igreja</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nova Consagração
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por cargo ou celebrante..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrdinations.length > 0 ? (
          filteredOrdinations.map(ord => (
            <div 
              key={ord.id}
              onClick={() => navigate(`/consagracoes/${ord.id}`)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <Award className="text-orange-500" size={24} />
                </div>
                <button 
                  onClick={(e) => handleDelete(ord.id, e)}
                  className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">{ord.category}</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={16} />
                  <span className="text-sm">{new Date(ord.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={16} />
                  <span className="text-sm">Celebrante: {ord.celebrant || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users size={16} />
                  <span className="text-sm">{ord.memberCount} membros consagrados</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex -space-x-2">
                  {ord.members?.slice(0, 4).map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                          {m.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                  {(ord.memberCount || 0) > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      +{(ord.memberCount || 0) - 4}
                    </div>
                  )}
                </div>
                <div className="text-orange-500 flex items-center gap-1 text-sm font-medium">
                  Ver detalhes
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Award className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Nenhuma consagração encontrada</p>
            <p className="text-slate-400 text-sm mt-1">Clique em "Nova Consagração" para registrar</p>
          </div>
        )}
      </div>

      <OrdinationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddOrdination}
        members={members}
      />
    </div>
  );
};

export default Ordinations;
