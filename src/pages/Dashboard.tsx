import React, { useState } from 'react';
import { Plus, Calendar, ArrowUpRight } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import MemberModal from '../components/modals/MemberModal';
import { Member } from '../types';

const Dashboard: React.FC = () => {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const handleSaveMember = (member: Omit<Member, 'id'> | Member) => {
    console.log('Saving member:', member);
    // In a real app, this would make an API call
    setIsMemberModalOpen(false);
  };
  const stats = [
    { label: "Total de Membros", value: "1,204", change: null },
    { label: "Frequência Média", value: "450", change: "+5%", positive: true },
    { label: "Doações (Este Mês)", value: "$15,320", change: null },
    { label: "Grupos Ativos", value: "12 / 15", change: null },
  ];

  const upcomingEvents = [
    { day: "29", month: "OUT", title: "Culto de Domingo", time: "10:00 - 12:00" },
    { day: "03", month: "NOV", title: "Encontro de Jovens", time: "19:00 - 20:30" },
    { day: "05", month: "NOV", title: "Ação Social", time: "09:00 - 13:00" },
  ];

  const recentDonations = [
    { name: "João Silva", date: "28 de Outubro, 2023", amount: "$250.00", icon: "JS" },
    { name: "Maria Santos", date: "27 de Outubro, 2023", amount: "$100.00", icon: "MS" },
    { name: "Anônimo", date: "26 de Outubro, 2023", amount: "$50.00", icon: "AN" },
  ];

  const chartData = [
    { name: 'Ativo', uv: 80, fill: '#f97316' }, // orange-500
    { name: 'Inativo', uv: 20, fill: '#e2e8f0' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={() => setIsMemberModalOpen(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} /> Adicionar Membro
        </button>
        <button className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          <Calendar size={16} /> Criar Evento
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
              {stat.change && (
                <span className={`text-sm font-medium mb-1 ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Próximos Eventos</h3>
          <div className="space-y-6">
            {upcomingEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex flex-col items-center bg-orange-50 rounded-lg px-3 py-2 min-w-[60px]">
                  <span className="text-orange-600 text-xs font-bold uppercase">{evt.month}</span>
                  <span className="text-slate-800 text-xl font-bold">{evt.day}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{evt.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{evt.time}</p>
                </div>
                <button className="text-orange-500 text-sm font-medium hover:text-orange-600">Detalhes</button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Doações Recentes</h3>
          <div className="space-y-6">
            {recentDonations.map((don, idx) => (
              <div key={idx} className="flex items-center gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                  {don.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800">{don.name}</h4>
                  <p className="text-xs text-slate-500">{don.date}</p>
                </div>
                <span className="font-semibold text-green-600">{don.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cell Group Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 mb-2">Atividade dos Grupos</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  barSize={10}
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background
                    dataKey="uv"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">80%</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Ativo</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">3 grupos reportaram atividade na última semana. Continue o bom trabalho!</p>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Grupo de Homens</span>
                <span>Atualizado há 2 dias</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Conexão Jovem</span>
                <span>Atualizado há 4 dias</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Estudo Bíblico das Senhoras</span>
                <span>Atualizado há 5 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div >
  );
};

export default Dashboard;
