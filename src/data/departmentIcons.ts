// Lista de ícones disponíveis para departamentos
export const DEPARTMENT_ICONS = [
    { name: 'Users', label: 'Pessoas', emoji: '👥' },
    { name: 'Music', label: 'Música', emoji: '🎵' },
    { name: 'Heart', label: 'Coração', emoji: '❤️' },
    { name: 'Book', label: 'Livro', emoji: '📖' },
    { name: 'Mic', label: 'Microfone', emoji: '🎤' },
    { name: 'Camera', label: 'Câmera', emoji: '📷' },
    { name: 'Coffee', label: 'Café', emoji: '☕' },
    { name: 'Baby', label: 'Bebê', emoji: '👶' },
    { name: 'Briefcase', label: 'Maleta', emoji: '💼' },
    { name: 'Shield', label: 'Escudo', emoji: '🛡️' },
    { name: 'Handshake', label: 'Aperto de Mão', emoji: '🤝' },
    { name: 'Gift', label: 'Presente', emoji: '🎁' },
    { name: 'Star', label: 'Estrela', emoji: '⭐' },
    { name: 'Globe', label: 'Globo', emoji: '🌍' },
    { name: 'Megaphone', label: 'Megafone', emoji: '📣' },
    { name: 'Clipboard', label: 'Prancheta', emoji: '📋' },
    { name: 'Calculator', label: 'Calculadora', emoji: '🧮' },
    { name: 'Palette', label: 'Paleta', emoji: '🎨' },
    { name: 'Wrench', label: 'Chave', emoji: '🔧' },
    { name: 'Car', label: 'Carro', emoji: '🚗' },
];

export const getIconEmoji = (iconName: string): string => {
    const icon = DEPARTMENT_ICONS.find(i => i.name === iconName);
    return icon?.emoji || '📁';
};
