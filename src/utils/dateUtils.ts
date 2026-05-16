export const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return '';
    // Se já estiver no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch (e) {
        return '';
    }
};

export const formatDateForDisplay = (dateString?: string | null): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return '-';
    }
};

/**
 * Converte diversos formatos de data para YYYY-MM-DD
 * Suporta: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, objetos Date
 */
export const parseFlexibleDate = (dateInput: any): string => {
    if (!dateInput) return '';
    
    // Se for objeto Date
    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) return '';
        return `${dateInput.getFullYear()}-${String(dateInput.getMonth() + 1).padStart(2, '0')}-${String(dateInput.getDate()).padStart(2, '0')}`;
    }

    const dateStr = String(dateInput).trim();
    if (!dateStr) return '';

    // Caso 1: DD/MM/YYYY ou DD-MM-YYYY (padrão Angola/Brasil)
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmmyyyy) {
        const [_, day, month, year] = ddmmyyyy;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Caso 2: YYYY-MM-DD (padrão ISO/Banco de Dados)
    const yyyymmdd = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(\s|T|$)/);
    if (yyyymmdd) {
        const [_, year, month, day] = yyyymmdd;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Caso 3: DD/MM/YY (ano com 2 dígitos)
    const ddmmyy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
    if (ddmmyy) {
        const [_, day, month, yearShort] = ddmmyy;
        const year = parseInt(yearShort) > 50 ? `19${yearShort}` : `20${yearShort}`;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Tenta o parser padrão do JS como última alternativa
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    } catch (e) {}

    return dateStr;
};
