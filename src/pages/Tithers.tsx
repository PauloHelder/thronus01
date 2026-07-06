import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    TrendingUp, 
    Calendar, 
    Download, 
    Loader2, 
    ChevronLeft, 
    ChevronRight,
    Heart,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    History,
    User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../hooks/useMembers';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { formatAOA } from '../utils/currency';
import { formatDateForDisplay, parseFlexibleDate } from '../utils/dateUtils';

const Tithers: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { members, loading: membersLoading } = useMembers();
    const [categories, setCategories] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [financeLoading, setFinanceLoading] = useState(true);

    useEffect(() => {
        if (!user?.churchId) return;

        const loadFinanceData = async () => {
            setFinanceLoading(true);
            try {
                const { data: cats, error: catsError } = await supabase
                    .from('financial_categories' as any)
                    .select('*')
                    .eq('church_id', user.churchId);

                if (catsError) throw catsError;
                setCategories(cats || []);

                const titheCat = (cats || []).find((c: any) => 
                    c.name.toLowerCase().includes('dízimo') || 
                    c.name.toLowerCase().includes('dizimo')
                );

                let query = supabase
                    .from('financial_transactions' as any)
                    .select('*')
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null);

                if (titheCat) {
                    query = query.or(`category_id.eq.${titheCat.id},description.ilike.%dízimo%,description.ilike.%dizimo%`);
                } else {
                    query = query.or('description.ilike.%dízimo%,description.ilike.%dizimo%');
                }

                const { data: txs, error: txsError } = await query.order('date', { ascending: false });
                if (txsError) throw txsError;

                setTransactions(txs || []);
            } catch (err) {
                console.error('Error loading finance tither data:', err);
                toast.error('Erro ao carregar dados financeiros.');
            } finally {
                setFinanceLoading(false);
            }
        };

        loadFinanceData();
    }, [user?.churchId]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPeriod, setFilterPeriod] = useState<'all' | 'month' | 'year' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Identify Tithe Category
    const titheCategory = useMemo(() => {
        return categories.find(c => 
            c.name.toLowerCase().includes('dízimo') || 
            c.name.toLowerCase().includes('dizimo')
        );
    }, [categories]);

    // Calculate Tither Stats
    const titherStats = useMemo(() => {
        if (!members.length) return [];

        const titheTransactions = transactions.filter(tx => {
            const matchesCategory = tx.category_id === titheCategory?.id || 
                tx.description.toLowerCase().includes('dízimo') ||
                tx.description.toLowerCase().includes('dizimo');
            
            if (!matchesCategory) return false;

            // Apply Date Filters
            if (filterPeriod === 'month') {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                return tx.date >= monthStart;
            } else if (filterPeriod === 'year') {
                const yearStart = `${new Date().getFullYear()}-01-01`;
                return tx.date >= yearStart;
            } else if (filterPeriod === 'custom' && startDate && endDate) {
                return tx.date >= startDate && tx.date <= endDate;
            }

            return true;
        });

        return members.map(member => {
            const memberTithes = titheTransactions.filter(tx => 
                (tx.source_id === member.id && tx.source_type === 'member') || 
                tx.description.toLowerCase().includes(member.name.toLowerCase()) ||
                (member.memberCode && tx.description.includes(member.memberCode))
            );

            const totalAmount = memberTithes.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const lastTithedDate = memberTithes.length > 0 
                ? memberTithes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
                : null;

            return {
                ...member,
                totalTithes: totalAmount,
                lastTithedDate,
                titheCount: memberTithes.length
            };
        }).filter(m => {
            if (searchTerm !== '') return true;
            if (viewMode === 'all') return true;
            return m.totalTithes > 0;
        });
    }, [members, transactions, titheCategory, searchTerm]);

    const filteredTithers = useMemo(() => {
        return titherStats.filter(t => {
            const matchesSearch = 
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (t.memberCode || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesSearch;
        }).sort((a, b) => b.totalTithes - a.totalTithes);
    }, [titherStats, searchTerm]);

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredTithers.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTithers = filteredTithers.slice(startIndex, startIndex + itemsPerPage);

    // Reset pagination to page 1 when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterPeriod, startDate, endDate, viewMode]);

    const formatCurrency = (value: number) => formatAOA(value);

    const handleExportExcel = async () => {
        try {
            const XLSX = await import('xlsx');
            const exportData = filteredTithers.map(t => ({
                'Código': t.memberCode || '-',
                'Nome': t.name,
                'Total Contribuído': t.totalTithes,
                'Última Contribuição': t.lastTithedDate ? formatDateForDisplay(t.lastTithedDate) : 'Nunca',
                'Qtd. Contribuições': t.titheCount
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "Dizimistas");
            XLSX.writeFile(wb, "dizimistas_tronus.xlsx");
            toast.success('Lista Excel exportada com sucesso!');
        } catch (error) {
            toast.error('Erro ao exportar lista Excel.');
        }
    };

    const handleExportPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.setTextColor(249, 115, 22);
            doc.text('Relatório Geral de Dizimistas', 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 28, { align: 'center' });

            // Stats row
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 35, 182, 15, 2, 2, 'F');
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Acumulado: ${formatCurrency(totalTitheVolume)}`, 20, 45);
            doc.text(`Dizimistas Ativos: ${activeTithersCount}`, 130, 45);

            let y = 60;
            doc.setFontSize(9);
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y, 182, 8, 'F');
            doc.text('Membro', 20, y + 5);
            doc.text('Código', 90, y + 5);
            doc.text('Última Contrib.', 120, y + 5);
            doc.text('Total Acumulado', 160, y + 5);
            
            y += 8;
            doc.setFont('helvetica', 'normal');

            filteredTithers.forEach((t, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                if (index % 2 === 0) {
                    doc.setFillColor(252, 253, 254);
                    doc.rect(14, y, 182, 8, 'F');
                }
                
                doc.text(t.name.substring(0, 35), 20, y + 5);
                doc.text(t.memberCode || '-', 90, y + 5);
                doc.text(t.lastTithedDate ? formatDateForDisplay(t.lastTithedDate) : 'Nunca', 120, y + 5);
                doc.text(formatCurrency(t.totalTithes), 160, y + 5);
                
                y += 8;
            });

            doc.save("relatorio_dizimistas_geral.pdf");
            toast.success('Relatório PDF exportado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao exportar PDF.');
        }
    };

    if (membersLoading || financeLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <Loader2 className="text-orange-500 animate-spin" size={48} />
            </div>
        );
    }

    const totalTitheVolume = titherStats.reduce((sum, t) => sum + t.totalTithes, 0);
    const activeTithersCount = titherStats.filter(t => t.totalTithes > 0).length;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Heart className="text-orange-500" fill="currentColor" />
                        Dizimistas
                    </h1>
                    <p className="text-slate-600 mt-1">Gestão e acompanhamento de contribuições</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm"
                    >
                        <Download size={18} />
                        Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md shadow-orange-100"
                    >
                        <Download size={18} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Volume Total</p>
                        <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalTitheVolume)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <History size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Dizimistas Ativos</p>
                        <p className="text-2xl font-bold text-slate-800">{activeTithersCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Média por Membro</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {formatCurrency(activeTithersCount > 0 ? totalTitheVolume / activeTithersCount : 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por nome ou código..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select 
                        value={filterPeriod} 
                        onChange={(e) => setFilterPeriod(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todo o período</option>
                        <option value="month">Este mês</option>
                        <option value="year">Este ano</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {filterPeriod === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-slate-400">até</span>
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    )}

                    <select 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="active">Apenas Dizimistas Ativos</option>
                        <option value="all">Todos os Membros</option>
                    </select>
                </div>
            </div>

            {/* Tithers List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Membro</th>
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Última Contribuição</th>
                                <th className="px-6 py-4 text-center">Frequência</th>
                                <th className="px-6 py-4 text-right">Total Acumulado</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedTithers.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/finance/tithers/${t.id}`)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200">
                                                {t.avatar ? <img src={t.avatar} className="w-full h-full object-cover" /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{t.name}</p>
                                                <p className="text-xs text-slate-500">{t.churchRole || 'Membro'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold border border-orange-100">
                                            {t.memberCode || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {t.lastTithedDate ? formatDateForDisplay(t.lastTithedDate) : 'Sem registros'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                                            {t.titheCount} contribuições
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                                        {formatCurrency(t.totalTithes)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTithers.length === 0 && (
                    <div className="text-center py-16">
                        <Heart className="mx-auto text-slate-200 mb-4" size={64} />
                        <p className="text-slate-500 font-medium text-lg">Nenhum dizimista encontrado</p>
                        <p className="text-sm text-slate-400 mt-1">Os membros que contribuírem com dízimos aparecerão aqui.</p>
                    </div>
                )}

                {/* Pagination */}
                {filteredTithers.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredTithers.length)} de {filteredTithers.length} dizimistas
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPage(c => Math.max(c - 1, 1));
                                }}
                                disabled={currentPage <= 1}
                                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm font-bold text-slate-700">
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPage(c => Math.min(c + 1, totalPages));
                                }}
                                disabled={currentPage >= totalPages}
                                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tithers;
