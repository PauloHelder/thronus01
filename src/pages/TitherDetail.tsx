import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Calendar, 
    DollarSign, 
    User, 
    History, 
    TrendingUp, 
    Download, 
    Loader2,
    Heart,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { useFinance, FinancialTransaction } from '../hooks/useFinance';
import { useMembers } from '../hooks/useMembers';
import { Member } from '../types';
import { toast } from 'sonner';
import { formatAOA } from '../utils/currency';

const TitherDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchMemberTransactions } = useFinance();
    const { members } = useMembers();
    
    const [member, setMember] = useState<Member | null>(null);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (id) {
            const foundMember = members.find(m => m.id === id);
            if (foundMember) {
                setMember(foundMember);
                loadTransactions(id);
            } else if (members.length > 0) {
                // If not found in memory, we might want to fetch it, but usually members are pre-loaded
                toast.error('Membro não encontrado');
                navigate('/finance/tithers');
            }
        }
    }, [id, members, navigate]);

    const loadTransactions = async (memberId: string) => {
        setLoading(true);
        const data = await fetchMemberTransactions(memberId);
        // Filter only tithes (Dízimos)
        const tithes = data.filter(tx => {
            const desc = tx.description.toLowerCase();
            const cat = tx.category?.name.toLowerCase() || '';
            const isTithe = desc.includes('dízimo') || desc.includes('dizimo') || 
                            cat.includes('dízimo') || cat.includes('dizimo') ||
                            desc.includes('oferta'); // Inclusive of offerings if linked to member
            return isTithe;
        });
        setTransactions(tithes);
        setLoading(false);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => 
            tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.date.includes(searchTerm)
        );
    }, [transactions, searchTerm]);

    const formatCurrency = (value: number) => formatAOA(value);

    const totalContributed = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const avgContribution = transactions.length > 0 ? totalContributed / transactions.length : 0;

    const handleExportPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(249, 115, 22); // Orange-500
            doc.text('Relatório de Contribuições', 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 28, { align: 'center' });

            // Member Info Box
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 35, 182, 35, 3, 3, 'FD');
            
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.setFont('helvetica', 'bold');
            doc.text(member.name, 20, 45);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Código: ${member.memberCode || 'S/C'}`, 20, 52);
            doc.text(`Email: ${member.email || 'Não informado'}`, 20, 58);
            doc.text(`Telefone: ${member.phone || 'Não informado'}`, 20, 64);

            doc.text(`Total Acumulado: ${formatCurrency(totalContributed)}`, 130, 45);
            doc.text(`Qtd. Lançamentos: ${transactions.length}`, 130, 52);

            // Table Header
            let y = 80;
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y, 182, 8, 'F');
            doc.text('Data', 20, y + 5);
            doc.text('Descrição', 50, y + 5);
            doc.text('Categoria', 110, y + 5);
            doc.text('Valor', 170, y + 5);
            
            y += 8;
            doc.setFont('helvetica', 'normal');

            // Table Rows
            filteredTransactions.forEach((tx, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                if (index % 2 === 0) {
                    doc.setFillColor(252, 253, 254);
                    doc.rect(14, y, 182, 8, 'F');
                }
                
                doc.text(new Date(tx.date).toLocaleDateString('pt-BR'), 20, y + 5);
                doc.text(tx.description.substring(0, 30), 50, y + 5);
                doc.text(tx.category?.name || 'Geral', 110, y + 5);
                doc.text(formatCurrency(tx.amount), 170, y + 5);
                
                y += 8;
                doc.setDrawColor(241, 245, 249);
                doc.line(14, y, 196, y);
            });

            doc.save(`historico_dizimos_${member.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
            toast.success('Relatório PDF gerado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao gerar PDF.');
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <Loader2 className="text-orange-500 animate-spin" size={48} />
            </div>
        );
    }

    if (!member) return null;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/finance/tithers')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-800">{member.name}</h1>
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full border border-orange-100">
                                {member.memberCode || 'S/C'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">Histórico detalhado de dízimos</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md shadow-orange-100"
                    >
                        <Download size={18} />
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* Profile & Stats Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Profile Info */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-400 overflow-hidden mb-4">
                            {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <User size={40} />}
                        </div>
                        <h2 className="font-bold text-slate-800 text-lg">{member.name}</h2>
                        <p className="text-sm text-slate-500">{member.churchRole || 'Membro'}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Contato</p>
                            <p className="text-sm text-slate-700 font-medium">{member.phone || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{member.email || 'Sem e-mail'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Membro desde</p>
                            <p className="text-sm text-slate-700 font-medium">
                                {member.joinDate ? new Date(member.joinDate).toLocaleDateString('pt-BR') : 'Data não registrada'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-fit">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg shadow-orange-200 text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                            <DollarSign size={20} />
                        </div>
                        <p className="text-orange-100 text-xs font-medium">Total Contribuído</p>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(totalContributed)}</p>
                        <p className="text-[10px] text-orange-200 mt-2 flex items-center gap-1">
                            <ArrowUpRight size={10} /> Desde o início
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <History size={20} />
                        </div>
                        <p className="text-slate-500 text-xs font-medium">Frequência</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{transactions.length}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-tighter">Contribuições</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-slate-500 text-xs font-medium">Média por Lançamento</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(avgContribution)}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-tighter">Valor Médio</p>
                    </div>

                    {/* Chart / List area */}
                    <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <History size={18} className="text-orange-500" />
                                Histórico de Lançamentos
                            </h3>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Filtrar lançamentos..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4">Conta</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                                {tx.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                                                    {tx.category?.name || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {tx.account?.name || 'Caixa'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">
                                                {formatCurrency(tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredTransactions.length === 0 && (
                            <div className="text-center py-12">
                                <History className="mx-auto text-slate-200 mb-2" size={40} />
                                <p className="text-slate-500 text-sm">Nenhum lançamento encontrado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TitherDetail;
