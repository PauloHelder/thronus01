
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { FinancialTransaction, FinancialCategory } from '../hooks/useFinance';

interface ExportData {
    transactions: FinancialTransaction[];
    categories: FinancialCategory[];
    churchName: string;
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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Ensure we parse the date correctly by adding time if it's just a date string
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

export const exportToExcel = ({ transactions, categories, churchName, filters, summary }: ExportData) => {
    const getCategoryName = (id?: string) => {
        if (!id) return 'Sem Categoria';
        return categories.find(c => c.id === id)?.name || 'Desconhecido';
    };

    const headerRows = [
        [churchName.toUpperCase()],
        ['RELATÓRIO DE ESTRATO FINANCEIRO'],
        [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
        [`Filtros: Tipo: ${filters.type === 'All' ? 'Todos' : (filters.type === 'income' ? 'Receitas' : 'Despesas')}, Categoria: ${filters.category}, Conta: ${filters.account}, Período: ${filters.startDate || 'Início'} a ${filters.endDate || 'Fim'}`],
        [],
        ['RESUMO DO PERÍODO'],
        ['Total Receitas', formatCurrency(summary.totalIncome)],
        ['Total Despesas', formatCurrency(summary.totalExpense)],
        ['Saldo Líquido', formatCurrency(summary.balance)],
        [],
        ['DATA', 'DESCRIÇÃO', 'CONTA', 'CATEGORIA', 'TIPO', 'VALOR (AOA)', 'STATUS']
    ];

    const transactionRows = transactions.map(tx => [
        formatDate(tx.date),
        tx.description,
        tx.account?.name || '-',
        getCategoryName(tx.category_id),
        tx.type === 'income' ? 'Receita' : 'Despesa',
        tx.amount,
        tx.status === 'paid' ? 'Efetivado' : 'Pendente'
    ]);

    const finalData = [...headerRows, ...transactionRows];

    const ws = XLSX.utils.aoa_to_sheet(finalData);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, // Data
        { wch: 40 }, // Descrição
        { wch: 20 }, // Conta
        { wch: 20 }, // Categoria
        { wch: 15 }, // Tipo
        { wch: 15 }, // Valor
        { wch: 15 }, // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');

    const fileName = `Estrato_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

export const exportToPDF = ({ transactions, categories, churchName, summary, filters }: ExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const drawHeader = (pageNum: number) => {
        // Logo representation
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.roundedRect(14, 10, 12, 12, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Tr', 17, 18);

        // Church Name & Title
        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.setFontSize(14);
        doc.text(churchName, 30, 15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
        doc.text('Sistema de Gestão Tronus', 30, 20);

        // Right side info
        doc.setFontSize(8);
        doc.text(`Página ${pageNum}`, pageWidth - 25, 15);
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 30, 20);

        // Divider
        doc.setDrawColor(COLORS.gray200[0], COLORS.gray200[1], COLORS.gray200[2]);
        doc.line(14, 25, pageWidth - 14, 25);
    };

    let currentPage = 1;
    drawHeader(currentPage);

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
    doc.text('ESTRATO FINANCEIRO', pageWidth / 2, 40, { align: 'center' });

    // Filters Summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    let filterLine = `Tipo: ${filters.type === 'All' ? 'Todos' : (filters.type === 'income' ? 'Receitas' : 'Despesas')}`;
    filterLine += `  |  Cat: ${filters.category}`;
    filterLine += `  |  Conta: ${filters.account}`;
    filterLine += `  |  Período: ${filters.startDate || 'Início'} a ${filters.endDate || 'Fim'}`;
    doc.text(filterLine, pageWidth / 2, 47, { align: 'center' });

    // Summary Scoreboard
    doc.setFillColor(COLORS.gray50[0], COLORS.gray50[1], COLORS.gray50[2]);
    doc.setDrawColor(COLORS.gray200[0], COLORS.gray200[1], COLORS.gray200[2]);
    doc.roundedRect(14, 55, pageWidth - 28, 30, 3, 3, 'FD');

    // Income
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    doc.text('TOTAL RECEITAS', 25, 65);
    doc.setTextColor(COLORS.green600[0], COLORS.green600[1], COLORS.green600[2]);
    doc.setFontSize(12);
    doc.text(formatCurrency(summary.totalIncome), 25, 75);

    // Expense
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    doc.text('TOTAL DESPESAS', 85, 65);
    doc.setTextColor(COLORS.red600[0], COLORS.red600[1], COLORS.red600[2]);
    doc.setFontSize(12);
    doc.text(formatCurrency(summary.totalExpense), 85, 75);

    // Balance
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    doc.text('SALDO LÍQUIDO', 145, 65);
    doc.setTextColor(summary.balance >= 0 ? COLORS.primary[0] : COLORS.red600[0], summary.balance >= 0 ? COLORS.primary[1] : COLORS.red600[1], summary.balance >= 0 ? COLORS.primary[2] : COLORS.red600[2]);
    doc.setFontSize(14);
    doc.text(formatCurrency(summary.balance), 145, 75);

    // Table Header
    let y = 100;
    doc.setFillColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
    doc.roundedRect(14, y - 6, pageWidth - 28, 10, 1, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.text('DATA', 16, y);
    doc.text('DESCRIÇÃO', 35, y);
    doc.text('CONTA', 95, y);
    doc.text('CATEGORIA', 125, y);
    doc.text('TIPO', 155, y);
    doc.text('VALOR (AOA)', pageWidth - 16, y, { align: 'right' });

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);

    const getCategoryName = (id?: string) => {
        if (!id) return 'Sem Categoria';
        return categories.find(c => c.id === id)?.name || 'Desconhecido';
    };

    transactions.forEach((tx, index) => {
        // Page break logic
        if (y > pageHeight - 20) {
            doc.addPage();
            currentPage++;
            drawHeader(currentPage);

            // Re-draw table header on new page
            y = 40;
            doc.setFillColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
            doc.roundedRect(14, y - 6, pageWidth - 28, 10, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('DATA', 16, y);
            doc.text('DESCRIÇÃO', 35, y);
            doc.text('CONTA', 95, y);
            doc.text('CATEGORIA', 125, y);
            doc.text('TIPO', 155, y);
            doc.text('VALOR (AOA)', pageWidth - 16, y, { align: 'right' });
            y += 10;
        }

        // Zebra striping
        if (index % 2 === 0) {
            doc.setFillColor(COLORS.gray50[0], COLORS.gray50[1], COLORS.gray50[2]);
            doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.setFontSize(8);

        doc.text(formatDate(tx.date), 16, y);

        let desc = tx.description || '';
        if (desc.length > 32) desc = desc.substring(0, 30) + '...';
        doc.text(desc, 35, y);

        let accName = tx.account?.name || '-';
        if (accName.length > 15) accName = accName.substring(0, 13) + '..';
        doc.text(accName, 95, y);

        let catName = getCategoryName(tx.category_id);
        if (catName.length > 15) catName = catName.substring(0, 13) + '..';
        doc.text(catName, 125, y);

        const typeLabel = tx.type === 'income' ? 'Rec' : 'Desp';
        doc.text(typeLabel, 155, y);

        // Color for value
        if (tx.type === 'income') {
            doc.setTextColor(COLORS.green600[0], COLORS.green600[1], COLORS.green600[2]);
            doc.text(`+ ${formatCurrency(tx.amount)}`, pageWidth - 16, y, { align: 'right' });
        } else {
            doc.setTextColor(COLORS.red600[0], COLORS.red600[1], COLORS.red600[2]);
            doc.text(`- ${formatCurrency(tx.amount)}`, pageWidth - 16, y, { align: 'right' });
        }

        // Border line
        doc.setDrawColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
        doc.line(14, y + 3, pageWidth - 14, y + 3);

        y += 8;
    });

    // Footer at the bottom of the last page
    doc.setFontSize(7);
    doc.setTextColor(COLORS.slate400[0], COLORS.slate400[1], COLORS.slate400[2]);
    doc.text('Relatório gerado automaticamente pelo Sistema Tronus Church Management.', pageWidth / 2, pageHeight - 10, { align: 'center' });

    const fileName = `Estrato_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
