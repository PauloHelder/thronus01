
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Asset, AssetCategory } from '../types/database.types';

interface AssetExportData {
    assets: Asset[];
    categories: AssetCategory[];
    churchName: string;
    filters: {
        category: string;
        condition: string;
        status: string;
        searchTerm: string;
    };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR');
};

const COLORS = {
    primary: [249, 115, 22], // Orange-500
    slate800: [30, 41, 59],
    slate600: [71, 85, 105],
    slate400: [148, 163, 184],
    gray50: [249, 250, 251],
    gray100: [243, 244, 246],
    gray200: [229, 231, 235],
};

const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
        new: 'Novo',
        good: 'Bom',
        fair: 'Regular',
        poor: 'Ruim',
        broken: 'Quebrado'
    };
    return labels[condition] || condition;
};

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        available: 'Disponível',
        in_use: 'Em Uso',
        under_maintenance: 'Manutenção',
        disposed: 'Descartado'
    };
    return labels[status] || status;
};

export const exportAssetsToExcel = ({ assets, churchName, filters }: AssetExportData) => {
    const headerRows = [
        [churchName.toUpperCase()],
        ['INVENTÁRIO DE PATRIMÔNIO'],
        [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
        [`Filtros: Categoria: ${filters.category}, Estado: ${filters.condition}, Status: ${filters.status}, Pesquisa: ${filters.searchTerm || 'Nenhuma'}`],
        [],
        ['NOME DO ATIVO', 'CATEGORIA', 'LOCALIZAÇÃO', 'ESTADO', 'STATUS', 'VALOR AQUISIÇÃO (AOA)', 'DATA AQUISIÇÃO', 'Nº SÉRIE']
    ];

    const assetRows = assets.map(asset => [
        asset.name,
        asset.category?.name || 'Geral',
        asset.location || asset.department?.name || 'Não definido',
        getConditionLabel(asset.condition),
        getStatusLabel(asset.status),
        asset.purchase_price,
        formatDate(asset.purchase_date),
        asset.serial_number || '-'
    ]);

    const finalData = [...headerRows, ...assetRows];
    const ws = XLSX.utils.aoa_to_sheet(finalData);

    ws['!cols'] = [
        { wch: 30 }, // Nome
        { wch: 20 }, // Categoria
        { wch: 25 }, // Localização
        { wch: 15 }, // Estado
        { wch: 15 }, // Status
        { wch: 20 }, // Valor
        { wch: 15 }, // Data
        { wch: 20 }, // SN
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patrimonio');

    const fileName = `Inventario_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

export const exportAssetsToPDF = ({ assets, churchName, filters }: AssetExportData) => {
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
    doc.text('INVENTÁRIO DE PATRIMÔNIO', pageWidth / 2, 40, { align: 'center' });

    // Filters Summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.slate600[0], COLORS.slate600[1], COLORS.slate600[2]);
    const filterLine = `Cat: ${filters.category} | Estado: ${filters.condition} | Status: ${filters.status}`;
    doc.text(filterLine, pageWidth / 2, 47, { align: 'center' });

    // Table Header
    let y = 60;
    doc.setFillColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
    doc.roundedRect(14, y - 6, pageWidth - 28, 10, 1, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.text('ATIVO', 16, y);
    doc.text('CATEGORIA', 60, y);
    doc.text('LOCALIZAÇÃO', 95, y);
    doc.text('ESTADO', 140, y);
    doc.text('STATUS', 165, y);
    doc.text('VALOR', pageWidth - 16, y, { align: 'right' });

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);

    assets.forEach((asset, index) => {
        if (y > pageHeight - 20) {
            doc.addPage();
            currentPage++;
            drawHeader(currentPage);
            y = 40;
            doc.setFillColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
            doc.roundedRect(14, y - 6, pageWidth - 28, 10, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('ATIVO', 16, y);
            doc.text('CATEGORIA', 60, y);
            doc.text('LOCALIZAÇÃO', 95, y);
            doc.text('ESTADO', 140, y);
            doc.text('STATUS', 165, y);
            doc.text('VALOR', pageWidth - 16, y, { align: 'right' });
            y += 10;
        }

        if (index % 2 === 0) {
            doc.setFillColor(COLORS.gray50[0], COLORS.gray50[1], COLORS.gray50[2]);
            doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.slate800[0], COLORS.slate800[1], COLORS.slate800[2]);
        doc.setFontSize(8);

        let name = asset.name || '';
        if (name.length > 25) name = name.substring(0, 23) + '..';
        doc.text(name, 16, y);

        doc.text(asset.category?.name || 'Geral', 60, y);

        let loc = asset.location || asset.department?.name || '-';
        if (loc.length > 20) loc = loc.substring(0, 18) + '..';
        doc.text(loc, 95, y);

        doc.text(getConditionLabel(asset.condition), 140, y);
        doc.text(getStatusLabel(asset.status), 165, y);
        doc.text(formatCurrency(asset.purchase_price || 0).replace('AOA', ''), pageWidth - 16, y, { align: 'right' });

        doc.setDrawColor(COLORS.gray100[0], COLORS.gray100[1], COLORS.gray100[2]);
        doc.line(14, y + 3, pageWidth - 14, y + 3);
        y += 8;
    });

    doc.setFontSize(7);
    doc.setTextColor(COLORS.slate400[0], COLORS.slate400[1], COLORS.slate400[2]);
    doc.text('Relatório de Inventário Patrimonial - Sistema Tronus', pageWidth / 2, pageHeight - 10, { align: 'center' });

    const fileName = `Inventario_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
