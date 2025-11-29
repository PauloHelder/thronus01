import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => void;
}

const ImportMembersModal: React.FC<ImportMembersModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (selectedFile: File) => {
        setError('');
        setSuccess('');

        // Validar tipo de arquivo
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
            setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)');
            return;
        }

        // Validar tamanho (máx 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('O arquivo é muito grande. Tamanho máximo: 5MB');
            return;
        }

        setFile(selectedFile);
        setSuccess(`Arquivo "${selectedFile.name}" selecionado com sucesso!`);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleImport = () => {
        if (!file) {
            setError('Por favor, selecione um arquivo primeiro');
            return;
        }

        // Aqui você processaria o arquivo Excel
        // Por enquanto, vamos simular o sucesso
        setSuccess('Importação concluída com sucesso!');

        // Simular dados importados
        const mockImportedData = [
            { name: 'João Silva', email: 'joao@example.com', phone: '123456789' },
            { name: 'Maria Santos', email: 'maria@example.com', phone: '987654321' }
        ];

        setTimeout(() => {
            onImport(mockImportedData);
            onClose();
        }, 1500);
    };

    const downloadTemplate = () => {
        // Criar um CSV de exemplo
        const csvContent = `Nome;Email;Telefone;Gênero;Data de Nascimento;Estado Civil;Endereço;Bairro;Distrito;Província;Batizado;Data de Batismo;Função na Igreja;Status
João Silva;joao@example.com;(244) 900 000 001;Masculino;1990-01-15;Casado;Rua Principal 123;Centro;Luanda;Luanda;Sim;2020-05-15;Membro;Active
Maria Santos;maria@example.com;(244) 900 000 002;Feminino;1985-03-20;Solteiro;Av. Central 456;Maianga;Luanda;Luanda;Não;;Visitante;Visitor`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_importacao_membros.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Upload className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Importar Membros</h2>
                            <p className="text-sm text-slate-600">Importe membros a partir de um arquivo Excel ou CSV</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Download Template */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileSpreadsheet className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-1">Baixar Modelo</h3>
                                <p className="text-sm text-blue-700 mb-3">
                                    Baixe o arquivo modelo para garantir que seus dados estejam no formato correto.
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Download size={16} />
                                    Baixar Modelo CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Instruções:</h3>
                        <ul className="space-y-1 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>Use o modelo fornecido para organizar seus dados</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>Formatos aceitos: .xlsx, .xls, .csv</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>Tamanho máximo: 5MB</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>Campos obrigatórios: Nome, Email, Telefone</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>Formato de data: AAAA-MM-DD (ex: 2024-01-15)</span>
                            </li>
                        </ul>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 bg-gray-50 hover:border-orange-400'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />

                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                <Upload className="text-orange-600" size={32} />
                            </div>

                            {file ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle size={20} />
                                    <span className="font-medium">{file.name}</span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-700 font-medium">
                                        Arraste e solte seu arquivo aqui
                                    </p>
                                    <p className="text-sm text-slate-500">ou</p>
                                </>
                            )}

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                            >
                                {file ? 'Escolher Outro Arquivo' : 'Selecionar Arquivo'}
                            </button>

                            <p className="text-xs text-slate-500 mt-2">
                                Formatos: .xlsx, .xls, .csv (máx. 5MB)
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white hover:bg-gray-100 text-slate-700 border border-gray-300 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${file
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Importar Membros
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportMembersModal;
