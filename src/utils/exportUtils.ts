import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { FinancialTransaction, FinancialCategory } from '../hooks/useFinance';
import { formatAOA } from './currency';

interface ExportData {
    transactions: FinancialTransaction[];
    categories: FinancialCategory[];
    churchName: string;
    openingBalance?: number;
    summary: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
    };
    filters: {
        type: string;
        category: string;
        account: string;
        startDate: string;
        endDate: string;
    };
}

const formatCurrency = (value: number) => formatAOA(value);

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR');
};

const COLORS = {
    primary: [249, 115, 22], // Orange-500
    primaryDark: [234, 88, 12], // Orange-600
    slate800: [30, 41, 59],
    slate600: [71, 85, 105],
    slate400: [148, 163, 184],
    green600: [22, 163, 74],
    red600: [220, 38, 38],
    gray50: [249, 250, 251],
    gray100: [243, 244, 246],
    gray200: [229, 231, 235],
};

export const exportToExcel = ({ transactions, categories, churchName, filters, summary, openingBalance }: ExportData) => {
    const getCategoryName = (id?: string) => {
        if (!id) return 'Sem Categoria';
        return categories.find(c => c.id === id)?.name || 'Desconhecido';
    };

    const headerRows = [
        [churchName.toUpperCase()],
        ['RELATÓRIO DE EXTRACTO FINANCEIRO'],
        [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
        [`Filtros: Tipo: ${filters.type === 'All' ? 'Todos' : (filters.type === 'income' ? 'Receitas' : 'Despesas')}, Categoria: ${filters.category}, Conta: ${filters.account}, Período: ${filters.startDate || 'Início'} a ${filters.endDate || 'Fim'}`],
        [],
        ['RESUMO DO PERÍODO'],
        ['Total Receitas', formatCurrency(summary.totalIncome)],
        ['Total Despesas', formatCurrency(summary.totalExpense)],
        ['Saldo Líquido', formatCurrency(summary.balance)],
        [],
        ['DATA', 'DATA DE REGISTO', 'DESCRIÇÃO', 'REFERÊNCIA', 'CATEGORIA', 'ENTRADA', 'SAÍDA', 'SALDO']
    ];

    const openingBalanceRow = [
        '-',
        '-',
        'SALDO INICIAL DO PERÍODO',
        '-',
        '-',
        '-',
        '-',
        openingBalance !== undefined ? openingBalance : 0
    ];

    const transactionRows = [
        openingBalanceRow,
        ...transactions.map(tx => {
            return [
                formatDate(tx.date),
                tx.created_at ? formatDate(tx.created_at.split('T')[0]) : '-',
                tx.description,
                tx.document_number || '-',
                getCategoryName(tx.category_id),
                tx.type === 'income' ? tx.amount : 0,
                tx.type === 'expense' ? tx.amount : 0,
                tx.running_balance !== undefined ? tx.running_balance : 0
            ];
        })
    ];

    const finalData = [...headerRows, ...transactionRows];

    const ws = XLSX.utils.aoa_to_sheet(finalData);

    ws['!cols'] = [
        { wch: 15 }, // Data
        { wch: 18 }, // Data de Registo
        { wch: 40 }, // Descrição
        { wch: 20 }, // Referência
        { wch: 20 }, // Categoria
        { wch: 15 }, // Entrada
        { wch: 15 }, // Saída
        { wch: 15 }, // Saldo
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');

    const fileName = `Extracto_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

export const exportToPDF = ({ transactions, categories, churchName, summary, filters, openingBalance }: ExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const drawHeader = (pageNum: number) => {
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.roundedRect(14, 10, 12, 12, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Tr', 17, 18);

        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.setFontSize(14);
        doc.text(churchName, 30, 15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
        doc.text('Sistema de Gestão Tronus', 30, 20);

        doc.setFontSize(8);
        doc.text(`Página ${pageNum}`, pageWidth - 25, 15);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 30, 20);

        doc.setDrawColor(COLORS.gray200[0], COLORS.gray200[1], COLORS.gray200[2]);
        doc.line(14, 25, pageWidth - 14, 25);
    };

    let currentPage = 1;
    drawHeader(currentPage);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
    doc.text('EXTRACTO FINANCEIRO', pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    let filterLine = `Tipo: ${filters.type === 'All' ? 'Todos' : (filters.type === 'income' ? 'Receitas' : 'Despesas')}`;
    filterLine += `  |  Cat: ${filters.category}`;
    filterLine += `  |  Conta: ${filters.account}`;
    filterLine += `  |  Período: ${filters.startDate || 'Início'} a ${filters.endDate || 'Fim'}`;
    doc.text(filterLine, pageWidth / 2, 47, { align: 'center' });

    doc.setFillColor(COLORS.gray50[0], COLORS.gray50[1], COLORS.gray50[2]);
    doc.setDrawColor(COLORS.gray200[0], COLORS.gray200[1], COLORS.gray200[2]);
    doc.roundedRect(14, 55, pageWidth - 28, 30, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    doc.text('TOTAL RECEITAS', 25, 65);
    doc.setTextColor(COLORS.green600[0], COLORS.green600[1], COLORS.green600[2]);
    doc.setFontSize(12);
    doc.text(formatCurrency(summary.totalIncome), 25, 75);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    doc.text('TOTAL DESPESAS', 85, 65);
    doc.setTextColor(COLORS.red600[0], COLORS.red600[1], COLORS.red600[2]);
    doc.setFontSize(12);
    doc.text(formatCurrency(summary.totalExpense), 85, 75);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    doc.text('SALDO LÍQUIDO', 145, 65);
    doc.setTextColor(summary.balance >= 0 ? COLORS.primary[0] : COLORS.red600[0], summary.balance >= 0 ? COLORS.primary[1] : COLORS.red600[1], summary.balance >= 0 ? COLORS.primary[2] : COLORS.red600[2]);
    doc.setFontSize(14);
    doc.text(formatCurrency(summary.balance), 145, 75);

    let y = 100;
    const drawTableHeader = () => {
        doc.setFillColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.roundedRect(14, y - 6, pageWidth - 28, 10, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('DATA / REGISTO', 16, y);
        doc.text('DESCRIÇÃO', 38, y);
        doc.text('REFERÊNCIA', 88, y);
        doc.text('CATEGORIA', 108, y);
        doc.text('VALOR (AOA)', 163, y, { align: 'right' });
        doc.text('SALDO (AOA)', pageWidth - 16, y, { align: 'right' });
        y += 10;
    };

    drawTableHeader();

    const getCategoryName = (id?: string) => {
        if (!id) return 'Sem Categoria';
        return categories.find(c => c.id === id)?.name || 'Desconhecido';
    };

    doc.setFillColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
    doc.text('SALDO INICIAL DO PERÍODO', 16, y);
    doc.text(formatCurrency(openingBalance || 0), pageWidth - 16, y, { align: 'right' });
    doc.line(14, y + 3, pageWidth - 14, y + 3);
    y += 9;

    transactions.forEach((tx, index) => {
        if (y > pageHeight - 20) {
            doc.setFillColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
            doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
            doc.text('A TRANSPORTAR (PÁG. SEGUINTE)', 16, y);
            const currentRunning = tx.running_balance !== undefined ? tx.running_balance : 0;
            doc.text(formatCurrency(currentRunning), pageWidth - 16, y, { align: 'right' });
            doc.line(14, y + 3, pageWidth - 14, y + 3);

            doc.addPage();
            currentPage++;
            drawHeader(currentPage);

            y = 40;
            drawTableHeader();

            doc.setFillColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
            doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
            doc.text('SALDO TRANSPORTADO (PÁG. ANTERIOR)', 16, y);
            doc.text(formatCurrency(currentRunning), pageWidth - 16, y, { align: 'right' });
            doc.line(14, y + 3, pageWidth - 14, y + 3);
            y += 9;
        }

        if (index % 2 === 0) {
            doc.setFillColor(COLORS.gray50[0], COLORS.gray50[1], COLORS.gray50[2]);
            doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.text(formatDate(tx.date), 16, y);

        if (tx.created_at) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
            doc.text(`Reg: ${formatDate(tx.created_at.split('T')[0])}`, 16, y + 3);
        }

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.setFontSize(8);

        let desc = tx.description || '';
        if (desc.length > 25) desc = desc.substring(0, 23) + '...';
        doc.text(desc, 38, y);

        let ref = tx.document_number || '-';
        if (ref.length > 12) ref = ref.substring(0, 10) + '..';
        doc.text(ref, 88, y);

        let catName = getCategoryName(tx.category_id);
        if (catName.length > 15) catName = catName.substring(0, 13) + '..';
        doc.text(catName, 108, y);

        if (tx.type === 'income') {
            doc.setTextColor(COLORS.green600[0], COLORS.green600[1], COLORS.green600[2]);
            doc.text(`+ ${formatCurrency(tx.amount)}`, 163, y, { align: 'right' });
        } else {
            doc.setTextColor(COLORS.red600[0], COLORS.red600[1], COLORS.red600[2]);
            doc.text(`- ${formatCurrency(tx.amount)}`, 163, y, { align: 'right' });
        }

        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.text(tx.running_balance !== undefined ? formatCurrency(tx.running_balance) : '-', pageWidth - 16, y, { align: 'right' });

        doc.setDrawColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
        doc.line(14, y + 4, pageWidth - 14, y + 4);

        y += 9;
    });

    if (y > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        drawHeader(currentPage);
        y = 40;
        drawTableHeader();
    }
    doc.setFillColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
    doc.text('SALDO FINAL DO PERÍODO', 16, y);
    const finalBalanceVal = transactions[transactions.length - 1]?.running_balance || summary.balance;
    doc.text(formatCurrency(finalBalanceVal), pageWidth - 16, y, { align: 'right' });
    doc.line(14, y + 3, pageWidth - 14, y + 3);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.slate400[0], COLORS.slate400[1], COLORS.slate400[2]);
    doc.text('Relatório gerado automaticamente pelo Sistema Tronus Church Management.', pageWidth / 2, pageHeight - 10, { align: 'center' });

    const fileName = `Extracto_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
