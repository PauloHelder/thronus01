import React, { useMemo, useRef, useState } from 'react';
import {
    TrendingDown,
    PieChart,
    FileDigit,
    ArrowDownRight,
    AlertTriangle,
    Download,
    Loader2,
    Clock
} from 'lucide-react';
import { Asset, AssetCategory } from '../types/database.types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface DepreciationReportProps {
    assets: Asset[];
    categories: AssetCategory[];
    calculateDepreciation: (asset: Asset) => number;
    formatCurrency: (value: number) => string;
    churchName?: string;
}

const DepreciationReport: React.FC<DepreciationReportProps> = ({
    assets,
    categories,
    calculateDepreciation,
    formatCurrency,
    churchName
}) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const reportData = useMemo(() => {
        const categoryData = categories.map(cat => {
            const catAssets = assets.filter(a => a.category_id === cat.id);
            const originalValue = catAssets.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0);
            const currentValue = catAssets.reduce((sum, a) => sum + calculateDepreciation(a), 0);
            const totalDepreciation = originalValue - currentValue;
            const deprecationRate = originalValue > 0 ? (totalDepreciation / originalValue) * 100 : 0;

            return {
                ...cat,
                originalValue,
                currentValue,
                totalDepreciation,
                deprecationRate,
                count: catAssets.length
            };
        }).filter(c => c.count > 0);

        const mostDepreciated = [...assets]
            .filter(a => Number(a.purchase_price) > 0)
            .map(a => {
                const dep = Number(a.purchase_price) - calculateDepreciation(a);
                const rate = (dep / Number(a.purchase_price)) * 100;
                return { ...a, dep, rate };
            })
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5);

        return { categoryData, mostDepreciated };
    }, [assets, categories, calculateDepreciation]);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setIsExporting(true);
        const toastId = toast.loading('Gerando relatório PDF...');

        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#f8fafc' // Matches bg-gray-50
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio_Depreciacao_${new Date().toISOString().split('T')[0]}.pdf`);

            toast.success('Relatório exportado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            toast.error('Falha ao gerar o PDF.', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Report Content to be Captured */}
            <div ref={reportRef} className="space-y-8 p-4 bg-gray-50 rounded-3xl">
                {/* PDF Header - Professional document style */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8 mt-2">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">Tronus • Patrimônio</h1>
                        <p className="text-xl font-bold text-slate-600 mt-1">{churchName || 'Relatório de Ativos'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Relatório Consolidado</p>
                        <h2 className="text-lg font-black text-slate-800">Depreciação de Ativos</h2>
                        <div className="flex items-center justify-end gap-2 text-slate-500 text-sm mt-1">
                            <Clock size={14} />
                            <span>Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <TrendingDown size={24} />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Perda Acumulada</span>
                        </div>
                        <h3 className="text-3xl font-black">
                            {formatCurrency(assets.reduce((sum, a) => sum + (Number(a.purchase_price || 0) - calculateDepreciation(a)), 0))}
                        </h3>
                        <p className="text-indigo-100 text-sm mt-1">Total depreciado até o momento</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <PieChart size={24} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Taxa Real</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">
                            {((assets.reduce((sum, a) => sum + (Number(a.purchase_price || 0) - calculateDepreciation(a)), 0) /
                                assets.reduce((sum, a) => sum + Number(a.purchase_price || 1), 0)) * 100).toFixed(1)}%
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Depreciação média da carteira</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Alerta de Troca</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">
                            {assets.filter(a => {
                                const dep = Number(a.purchase_price || 0) - calculateDepreciation(a);
                                const rate = Number(a.purchase_price) > 0 ? (dep / Number(a.purchase_price)) * 100 : 0;
                                return rate > 80;
                            }).length} Ativos
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Itens com mais de 80% de depreciação</p>
                    </div>
                </div>

                {/* Category Analysis */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                            <FileDigit className="text-indigo-500" size={20} />
                            Análise por Categoria
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Categoria</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Custo Orig.</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">V. Contábil</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Depreciação</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reportData.categoryData.map(cat => (
                                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{cat.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono uppercase">{cat.count} ativos</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">{formatCurrency(cat.originalValue)}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-800">{formatCurrency(cat.currentValue)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-red-600 font-bold">-{formatCurrency(cat.totalDepreciation)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden min-w-[100px]">
                                                <div
                                                    className={`h-full rounded-full ${cat.deprecationRate > 70 ? 'bg-red-500' : cat.deprecationRate > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(cat.deprecationRate, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-[8px] text-center mt-1 font-black text-slate-400 uppercase tracking-tighter">
                                                {cat.deprecationRate.toFixed(1)}% Depreciado
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Critical Assets */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                            <ArrowDownRight className="text-red-500" size={20} />
                            Maiores Perdas de Valor
                        </h3>
                        <div className="space-y-4">
                            {reportData.mostDepreciated.map(asset => (
                                <div key={asset.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-red-200 transition-colors">
                                    <div className="p-2 bg-white rounded-xl text-red-600 shadow-sm border border-red-50 font-black text-xs">
                                        {asset.rate.toFixed(0)}%
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 truncate">{asset.name}</p>
                                        <p className="text-xs text-slate-500">Perda de {formatCurrency(asset.dep)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-800">{formatCurrency(calculateDepreciation(asset))}</p>
                                        <p className="text-[10px] text-slate-400">Restante</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-xl font-black mb-2">Exportar Relatório</h3>
                            <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                                Gere um documento PDF ou Excel completo com a análise de depreciação para fins contábeis e fiscais da igreja.
                            </p>
                            <div className="mt-auto flex gap-3">
                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 transition-all active:scale-95 shadow-lg disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                    {isExporting ? 'Processando...' : 'PDF Completo'}
                                </button>
                                <button className="px-6 py-3 bg-indigo-800 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 border border-indigo-700">
                                    <FileDigit size={18} /> Excel (XLSX)
                                </button>
                            </div>
                        </div>
                        {/* Abstract design elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full -ml-16 -mb-16 blur-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepreciationReport;
