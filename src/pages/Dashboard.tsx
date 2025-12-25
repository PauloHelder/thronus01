import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, TrendingUp, Heart, Activity, ArrowUpRight, Loader2, CalendarDays, UserPlus, BookOpen, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MemberModal from '../components/modals/MemberModal';
import { Member } from '../types';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalGroups: number;
  activeGroups: number;
  totalDepartments: number;
  upcomingEvents: number;
  activeClasses: number;
  totalStudents: number;
}

interface RecentActivity {
  id: string;
  type: 'member' | 'service' | 'event' | 'transaction';
  title: string;
  description: string;
  time: string;
  icon: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalDepartments: 0,
    upcomingEvents: 0,
    activeClasses: 0,
    totalStudents: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [memberGrowth, setMemberGrowth] = useState<any[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas
      const [
        membersResult,
        groupsResult,
        departmentsResult,
        eventsResult,
        classesResult,
      ] = await Promise.all([
        supabase.from('members').select('id, status, created_at').is('deleted_at', null),
        supabase.from('groups').select('id, status').is('deleted_at', null),
        supabase.from('departments').select('id'),
        supabase.from('events').select('id, title, date, start_time, type').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5),
        supabase.from('teaching_classes').select('id, name, status, students:teaching_class_students(member_id)').is('deleted_at', null),
      ]);

      // Calcular estatísticas
      const totalMembers = membersResult.data?.length || 0;
      const activeMembers = membersResult.data?.filter(m => m.status === 'Active').length || 0;
      const totalGroups = groupsResult.data?.length || 0;
      const activeGroups = groupsResult.data?.filter(g => g.status === 'Active').length || 0;
      const totalDepartments = departmentsResult.data?.length || 0;
      const upcomingEventsCount = eventsResult.data?.length || 0;

      // Calcular estatísticas de Ensino
      const classes = classesResult.data || [];
      const activeClasses = classes.filter(c => c.status === 'Em Andamento' || c.status === 'Agendado' || c.status === 'Agendada').length;

      // Total Unique Students across all classes
      const uniqueStudents = new Set();
      classes.forEach((c: any) => {
        c.students?.forEach((s: any) => uniqueStudents.add(s.member_id));
      });
      const totalStudents = uniqueStudents.size;

      // Prepare chart data (Top 5 classes by students)
      const classesChartData = classes
        .map((c: any) => ({
          name: c.name,
          students: c.students?.length || 0
        }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 5);

      setClassesData(classesChartData);

      setStats({
        totalMembers,
        activeMembers,
        totalGroups,
        activeGroups,
        totalDepartments,
        upcomingEvents: upcomingEventsCount,
        activeClasses,
        totalStudents,
      });

      // Eventos próximos
      setUpcomingEvents(eventsResult.data || []);

      // Crescimento de membros (últimos 6 meses)
      const growthData = calculateMemberGrowth(membersResult.data || []);
      setMemberGrowth(growthData);

      // Atividades recentes
      const activities = await loadRecentActivities();
      setRecentActivities(activities);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async (): Promise<RecentActivity[]> => {
    const activities: RecentActivity[] = [];

    try {
      // Membros recentes
      const { data: recentMembers } = await supabase
        .from('members')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentMembers?.forEach(member => {
        activities.push({
          id: `member-${member.name}`,
          type: 'member',
          title: 'Novo Membro',
          description: `${member.name} foi adicionado`,
          time: formatRelativeTime(member.created_at),
          icon: 'UserPlus',
        });
      });

      // Eventos recentes
      const { data: recentEvents } = await supabase
        .from('events')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      recentEvents?.forEach(event => {
        activities.push({
          id: `event-${event.title}`,
          type: 'event',
          title: 'Novo Evento',
          description: event.title,
          time: formatRelativeTime(event.created_at),
          icon: 'Calendar',
        });
      });

      // Ordenar por tempo
      activities.sort((a, b) => {
        const timeA = a.time.includes('há') ? parseInt(a.time) : 0;
        const timeB = b.time.includes('há') ? parseInt(b.time) : 0;
        return timeA - timeB;
      });

      return activities.slice(0, 5);
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  };

  const calculateMemberGrowth = (members: any[]) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const data = months.map((month, index) => {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - (5 - index));

      const count = members.filter(m => {
        const createdDate = new Date(m.created_at);
        return createdDate.getMonth() === monthDate.getMonth() &&
          createdDate.getFullYear() === monthDate.getFullYear();
      }).length;

      return { month, members: count };
    });

    return data;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays}d`;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase(),
    };
  };

  const handleSaveMember = async (member: Omit<Member, 'id'> | Member) => {
    try {
      const { error } = await supabase.from('members').insert({
        name: member.name,
        email: member.email,
        phone: member.phone,
        status: member.status,
        church_role: member.churchRole,
        is_baptized: member.isBaptized,
        baptism_date: member.baptismDate,
        birth_date: member.birthDate,
        gender: member.gender,
        marital_status: member.maritalStatus,
        address: member.address,
      });

      if (!error) {
        setIsMemberModalOpen(false);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error saving member:', error);
    }
  };

  const pieData = [
    { name: 'Ativos', value: stats.activeMembers, color: '#10b981' },
    { name: 'Inativos', value: stats.totalMembers - stats.activeMembers, color: '#e2e8f0' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Bem-vindo, {user?.fullName?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-slate-600 mt-1">Aqui está o resumo da sua igreja hoje</p>
        </div>
        <div className="flex gap-3">
          {hasPermission('members_create') && (
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/30"
            >
              <Plus size={16} /> Adicionar Membro
            </button>
          )}
          {hasPermission('events_create') && (
            <button
              onClick={() => navigate('/events')}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Calendar size={16} /> Criar Evento
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-70" />
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Total de Membros</h3>
          <p className="text-3xl font-bold">{stats.totalMembers}</p>
          <p className="text-white/70 text-xs mt-2">{stats.activeMembers} ativos</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-70" />
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Grupos Ativos</h3>
          <p className="text-3xl font-bold">{stats.activeGroups}</p>
          <p className="text-white/70 text-xs mt-2">de {stats.totalGroups} grupos</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-70" />
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Próximos Eventos</h3>
          <p className="text-3xl font-bold">{stats.upcomingEvents}</p>
          <p className="text-white/70 text-xs mt-2">este mês</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-70" />
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Total de Alunos</h3>
          <p className="text-3xl font-bold">{stats.totalStudents}</p>
          <p className="text-white/70 text-xs mt-2">{stats.activeClasses} turmas ativas</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Crescimento de Membros
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="members"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Teaching Overview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Alunos por Turma
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="students" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Próximos Eventos
          </h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => {
                const { day, month } = formatEventDate(event.date);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="flex flex-col items-center bg-orange-50 rounded-lg px-3 py-2 min-w-[60px]">
                      <span className="text-orange-600 text-xs font-bold uppercase">{month}</span>
                      <span className="text-slate-800 text-xl font-bold">{day}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{event.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {event.start_time || 'Horário a definir'}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {event.type}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum evento próximo</p>
              </div>
            )}
          </div>
        </div>

        {/* Member Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Status dos Membros
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Atividades Recentes
          </h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                    {activity.icon === 'UserPlus' && <UserPlus size={16} />}
                    {activity.icon === 'Calendar' && <Calendar size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                    <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div>
  );
};

export default Dashboard;
