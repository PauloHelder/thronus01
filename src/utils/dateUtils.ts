export const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return '';
    // Se já estiver no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        // Retorna a data no formato YYYY-MM-DD respeitando o fuso de Angola (GMT+1)
        return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
    } catch (e) {
        return '';
    }
};

export const formatDateForDisplay = (dateString?: string | null): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        // Exibe no padrão dia/mês/ano de Angola
        return date.toLocaleDateString('pt-BR', { timeZone: 'Africa/Luanda' });
    } catch (e) {
        return '-';
    }
};

/**
 * Converte diversos formatos de data para YYYY-MM-DD
 * Suporta: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, objetos Date
 * Configurado explicitamente para o fuso de Angola (Africa/Luanda - GMT+1)
 */
export const parseFlexibleDate = (dateInput: any): string => {
    if (!dateInput) return '';
    
    // Se for objeto Date (comum em importações Excel)
    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) return '';
        
        // Para objetos Date vindos do Excel/JS, adicionamos 12 horas para garantir que caia no meio do dia
        // Isso evita que desvios de fuso horário (ex: -1h ou -3h) movam a data para o dia anterior.
        const midDay = new Date(dateInput.getTime() + (12 * 60 * 60 * 1000));
        
        // Formata manualmente para YYYY-MM-DD usando o fuso de Angola
        try {
            const parts = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Africa/Luanda'
            }).formatToParts(midDay);
            
            const year = parts.find(p => p.type === 'year')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const day = parts.find(p => p.type === 'day')?.value;
            
            return `${year}-${month}-${day}`;
        } catch (e) {
            // Fallback se Intl falhar
            return midDay.toISOString().split('T')[0];
        }
    }

    let dateStr = String(dateInput).trim();
    if (!dateStr) return '';

    // Caso 1: DD/MM/YYYY ou DD-MM-YYYY (padrão Angola/Brasil)
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmmyyyy) {
        const [_, day, month, year] = ddmmyyyy;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Caso 2: YYYY-MM-DD (padrão ISO/Banco de Dados)
    const yyyymmdd = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
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

    // Tenta o parser padrão do JS como última alternativa para formatos como "Jan 15, 2024"
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            // Aplica a mesma lógica do buffer de 12h
            const midDay = new Date(date.getTime() + (12 * 60 * 60 * 1000));
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Africa/Luanda'
            }).format(midDay);
        }
    } catch (e) {}

    return dateStr;
};
