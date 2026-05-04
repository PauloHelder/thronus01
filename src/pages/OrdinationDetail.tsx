import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrdinations } from '../hooks/useOrdinations';
import { ArrowLeft, Award, Calendar, User, Users, Info, ChevronRight, Loader2 } from 'lucide-react';

const OrdinationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ordinations, loading } = useOrdinations();

  const ordination = ordinations.find(o => o.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!ordination) {
    return (
      <div className="p-8 text-center h-screen flex flex-col items-center justify-center">
        <Award className="text-slate-200 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-slate-800">Consagração não encontrada</h2>
        <button onClick={() => navigate('/consagracoes')} className="mt-4 text-orange-500 flex items-center gap-2 mx-auto font-medium hover:underline">
          <ArrowLeft size={18} /> Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/consagracoes')}
        className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Voltar para Consagrações
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Award size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{ordination.category}</h1>
                <p className="opacity-90 flex items-center gap-2 mt-1">
                  <Calendar size={16} />
                  {new Date(ordination.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
              <p className="text-xs opacity-80 uppercase tracking-widest font-bold text-center mb-1">Total Consagrados</p>
              <p className="text-3xl font-black text-center">{ordination.memberCount}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                Lista de Consagrados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ordination.members?.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{m.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{m.churchRole}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                <Info className="text-orange-500" size={22} />
                Detalhes do Ato
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Ministro Celebrante</label>
                  <div className="flex items-center gap-2 mt-1.5 text-slate-800 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                      <User size={16} />
                    </div>
                    <p className="font-bold truncate">{ordination.celebrant || 'Não informado'}</p>
                  </div>
                </div>
                {ordination.notes && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Observações</label>
                    <div className="mt-1.5 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-slate-700 text-sm leading-relaxed">{ordination.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <p className="text-orange-800 text-sm font-medium leading-relaxed">
                Este é um registro histórico permanente. As alterações realizadas aqui refletem o momento oficial da ordenação ministerial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdinationDetail;
