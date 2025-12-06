export const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return '';
    // Se já estiver no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    try {
        // Tenta criar um objeto Date e extrair YYYY-MM-DD
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
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
