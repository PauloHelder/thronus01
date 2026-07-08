import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, FileText, Award, Calendar, Search, Trash2, Printer, 
    Plus, Settings, CheckCircle2, Clock, X, ArrowLeft, Upload, 
    Loader2, CreditCard, Check, Building, FileDigit, Sparkles, BookOpen
} from 'lucide-react';
import { useDocuments, IssuedDocument } from '../hooks/useDocuments';
import { useMembers } from '../hooks/useMembers';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Cursive Google Font injected dynamically for Certificate Signatures
const loadCertificateFonts = () => {
    const id = 'google-fonts-cursive';
    if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@500;700;800&family=Great+Vibes&family=Playfair+Display:ital,wght@0,600;1,400&display=swap';
        document.head.appendChild(link);
    }
};

const Documents: React.FC = () => {
    const { user } = useAuth();
    const { members } = useMembers();
    const { 
        documents, loading, error, fetchDocuments, 
        addDocument, deleteDocument, getChurchSettings, 
        updateChurchSettings, uploadSignature 
    } = useDocuments();

    // UI State
    const [activeTab, setActiveTab] = useState<'historico' | 'emitir' | 'config'>('historico');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    
    // Config State
    const [configData, setConfigData] = useState({
        signer_name: '',
        signer_role: '',
        signature_url: '',
        custom_logo_url: '',
        certificate_subtitle: 'Catedral da Fé'
    });
    const [uploadingSign, setUploadingSign] = useState(false);

    // Document Generation State
    const [selectedDocType, setSelectedDocType] = useState<IssuedDocument['document_type'] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Auto-complete member search inside form
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);

    // Form inputs
    const [formData, setFormData] = useState<any>({
        // General
        title: '',
        recipient_name: '',
        notes: '',
        // Recommendation
        dest_church: '',
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days default
        // Baptism
        baptism_date: '',
        baptism_place: '',
        celebrant: '',
        // Presentation
        child_name: '',
        father_name: '',
        mother_name: '',
        birth_date: '',
        presentation_date: new Date().toISOString().split('T')[0],
        officiating_pastor: '',
        // Course completion
        course_name: '',
        completion_date: new Date().toISOString().split('T')[0],
        course_hours: '40',
        instructor: ''
    });

    // Refs for PDF capture
    const printContainerRef = useRef<HTMLDivElement>(null);
    const [previewDocData, setPreviewDocData] = useState<any | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<IssuedDocument | null>(null);

    // Load initial data
    useEffect(() => {
        loadCertificateFonts();
        fetchDocuments();
        loadChurchSettings();
    }, [fetchDocuments]);

    const loadChurchSettings = async () => {
        const settingsObj = await getChurchSettings();
        if (settingsObj) {
            const settings = settingsObj.settings || {};
            setConfigData({
                signer_name: settings.signer_name || '',
                signer_role: settings.signer_role || '',
                signature_url: settings.signature_url || '',
                custom_logo_url: settingsObj.logo_url || '',
                certificate_subtitle: settings.certificate_subtitle || user?.churchName || ''
            });
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await updateChurchSettings({
            signer_name: configData.signer_name,
            signer_role: configData.signer_role,
            signature_url: configData.signature_url,
            certificate_subtitle: configData.certificate_subtitle
        });
        if (success) {
            toast.success('Configurações da secretaria atualizadas!');
        } else {
            toast.error('Erro ao atualizar configurações.');
        }
    };

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingSign(true);
        const toastId = toast.loading('Enviando assinatura...');
        try {
            const url = await uploadSignature(file);
            if (url) {
                setConfigData(prev => ({ ...prev, signature_url: url }));
                toast.success('Assinatura digitalizada enviada!', { id: toastId });
            } else {
                toast.error('Falha ao enviar arquivo.', { id: toastId });
            }
        } catch (err) {
            toast.error('Erro no upload.', { id: toastId });
        } finally {
            setUploadingSign(false);
        }
    };

    // Filter members for autocomplete
    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        (m.memberCode && m.memberCode.toLowerCase().includes(memberSearchTerm.toLowerCase()))
    );

    const handleSelectMember = (member: any) => {
        setSelectedMember(member);
        setMemberSearchTerm(member.name);
        setShowMemberDropdown(false);
        // Pre-populate fields based on member
        setFormData(prev => ({
            ...prev,
            recipient_name: member.name,
            baptism_date: member.baptismDate || '',
            baptism_place: member.baptismPlace || '',
            celebrant: prev.celebrant || configData.signer_name
        }));
    };

    const handleOpenTypeForm = (type: IssuedDocument['document_type']) => {
        setSelectedDocType(type);
        setSelectedMember(null);
        setMemberSearchTerm('');
        
        let initialTitle = '';
        switch(type) {
            case 'member_card': initialTitle = 'Cartão de Membro'; break;
            case 'recommendation': initialTitle = 'Carta de Recomendação'; break;
            case 'baptism_cert': initialTitle = 'Certificado de Batismo'; break;
            case 'presentation_cert': initialTitle = 'Certificado de Apresentação'; break;
            case 'course_cert': initialTitle = 'Certificado de Conclusão de Curso'; break;
        }

        setFormData({
            title: initialTitle,
            recipient_name: '',
            notes: '',
            dest_church: '',
            expiry_date: type === 'member_card' 
                ? new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 years
                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
            baptism_date: '',
            baptism_place: '',
            celebrant: configData.signer_name,
            child_name: '',
            father_name: '',
            mother_name: '',
            birth_date: '',
            presentation_date: new Date().toISOString().split('T')[0],
            officiating_pastor: configData.signer_name,
            course_name: '',
            completion_date: new Date().toISOString().split('T')[0],
            course_hours: '40',
            instructor: configData.signer_name
        });
    };

    const getDocumentLabel = (type: IssuedDocument['document_type']) => {
        switch(type) {
            case 'member_card': return 'Cartão de Membro';
            case 'recommendation': return 'Carta de Recomendação';
            case 'baptism_cert': return 'Certificado de Batismo';
            case 'presentation_cert': return 'Certificado de Apresentação';
            case 'course_cert': return 'Certificado de Curso';
        }
    };

    const getDocumentIcon = (type: IssuedDocument['document_type'], size = 20) => {
        switch(type) {
            case 'member_card': return <CreditCard size={size} />;
            case 'recommendation': return <FileText size={size} />;
            case 'baptism_cert': return <Award size={size} />;
            case 'presentation_cert': return <Award size={size} />;
            case 'course_cert': return <BookOpen size={size} />;
        }
    };

    const handleConfirmDelete = async () => {
        if (!docToDelete) return;
        const success = await deleteDocument(docToDelete.id);
        if (success) {
            toast.success('Documento removido do histórico.');
        } else {
            toast.error('Erro ao remover documento.');
        }
        setIsDeleteModalOpen(false);
        setDocToDelete(null);
    };

    // Client-side PDF generation handler
    const handleGeneratePDF = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const rName = selectedDocType === 'presentation_cert' ? formData.child_name : formData.recipient_name;
        if (!rName) {
            toast.warning('Por favor, preencha o nome do destinatário/membro.');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Rendendo documento e gerando PDF...');

        try {
            // Wait brief moment for React DOM state to update template ref container
            const hashCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            
            // Build preview mock info
            const previewData = {
                hashCode,
                issue_date: new Date().toLocaleDateString('pt-BR'),
                ...formData,
                recipient_name: rName
            };
            
            setPreviewDocData(previewData);

            // Wait for render
            await new Promise(r => setTimeout(r, 600));

            const printElement = printContainerRef.current;
            if (!printElement) throw new Error('Preview wrapper element not found');

            // Set specific styling settings based on document type
            const isBadge = selectedDocType === 'member_card';
            const isLandscape = selectedDocType !== 'recommendation' && selectedDocType !== 'member_card';

            const canvas = await html2canvas(printElement, {
                scale: 3, // High DPI for high quality printable PDFs
                logging: false,
                useCORS: true,
                backgroundColor: null
            });

            const imgData = canvas.toDataURL('image/png');
            let pdf;

            if (isBadge) {
                // Member Card: Credit card dimensions (85.6mm x 54mm) -> Standard ID-1
                // We add two pages: Page 1 (Frente), Page 2 (Verso)
                pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: [85.6, 54]
                });

                // Front side capture
                const frontCanvas = await html2canvas(printElement.querySelector('.card-front') as HTMLDivElement, {
                    scale: 3.5,
                    useCORS: true
                });
                const frontImg = frontCanvas.toDataURL('image/png');
                pdf.addImage(frontImg, 'PNG', 0, 0, 85.6, 54);

                // Back side capture
                pdf.addPage([85.6, 54], 'landscape');
                const backCanvas = await html2canvas(printElement.querySelector('.card-back') as HTMLDivElement, {
                    scale: 3.5,
                    useCORS: true
                });
                const backImg = backCanvas.toDataURL('image/png');
                pdf.addImage(backImg, 'PNG', 0, 0, 85.6, 54);

            } else {
                // Certificates or Letters (A4 size)
                const orientation = isLandscape ? 'landscape' : 'portrait';
                pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            // Save PDF locally
            const filename = `${formData.title.replace(/\s+/g, '_')}_${rName.replace(/\s+/g, '_')}.pdf`;
            pdf.save(filename);

            // Record to Database history
            const docDetails: any = {};
            if (selectedDocType === 'recommendation') {
                docDetails.dest_church = formData.dest_church;
                docDetails.expiry_date = formData.expiry_date;
            } else if (selectedDocType === 'baptism_cert') {
                docDetails.baptism_date = formData.baptism_date;
                docDetails.baptism_place = formData.baptism_place;
                docDetails.celebrant = formData.celebrant;
            } else if (selectedDocType === 'presentation_cert') {
                docDetails.child_name = formData.child_name;
                docDetails.father_name = formData.father_name;
                docDetails.mother_name = formData.mother_name;
                docDetails.birth_date = formData.birth_date;
                docDetails.presentation_date = formData.presentation_date;
                docDetails.officiating_pastor = formData.officiating_pastor;
            } else if (selectedDocType === 'course_cert') {
                docDetails.course_name = formData.course_name;
                docDetails.completion_date = formData.completion_date;
                docDetails.course_hours = formData.course_hours;
                docDetails.instructor = formData.instructor;
            }

            await addDocument({
                member_id: selectedMember?.id || null,
                document_type: selectedDocType!,
                title: formData.title,
                recipient_name: rName,
                recipient_details: docDetails,
                issue_date: new Date().toISOString().split('T')[0],
                metadata: {
                    notes: formData.notes || '',
                    signer_name: configData.signer_name,
                    signer_role: configData.signer_role,
                    hashCode
                }
            });

            toast.success('Documento emitido e registado com sucesso!', { id: toastId });
            setSelectedDocType(null);
            setPreviewDocData(null);
        } catch (err) {
            console.error('Error generating PDF:', err);
            toast.error('Erro ao gerar o PDF do documento.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter historical documents
    const filteredDocs = documents.filter(d => {
        const matchesSearch = d.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.hash_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || d.document_type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="h-full overflow-y-auto bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Building className="text-orange-500" />
                        Secretaria e Documentação
                    </h1>
                    <p className="text-sm text-slate-500">Emissão de cartões de membros, cartas de recomendação e certificados</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'historico' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                    >
                        Histórico de Emissões
                    </button>
                    <button
                        onClick={() => {
                            if (!configData.signer_name) {
                                toast.info('Configure a assinatura e nome do assinante primeiro.');
                                setActiveTab('config');
                            } else {
                                setActiveTab('emitir');
                                setSelectedDocType(null);
                            }
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'emitir' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                    >
                        Emitir Documento
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`p-2.5 rounded-xl border transition-all ${
                            activeTab === 'config' 
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' 
                                : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                        }`}
                        title="Configurar Assinaturas"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
                {activeTab === 'historico' && (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                        {/* Filters toolbar */}
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/30">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome, título ou hash..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm transition-all"
                                />
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm"
                                >
                                    <option value="all">Todos os tipos</option>
                                    <option value="member_card">Cartão de Membro</option>
                                    <option value="recommendation">Carta de Recomendação</option>
                                    <option value="baptism_cert">Certificado de Batismo</option>
                                    <option value="presentation_cert">Certificado de Apresentação</option>
                                    <option value="course_cert">Certificado de Curso</option>
                                </select>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Código / Hash</th>
                                        <th className="px-6 py-4">Data Emissão</th>
                                        <th className="px-6 py-4">Destinatário</th>
                                        <th className="px-6 py-4">Tipo de Documento</th>
                                        <th className="px-6 py-4">Assinante</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                <Loader2 className="animate-spin mx-auto mb-2 text-orange-500" />
                                                Carregando histórico de documentos...
                                            </td>
                                        </tr>
                                    ) : filteredDocs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                                <p className="font-bold text-slate-700 text-sm">Nenhum documento emitido encontrado</p>
                                                <p className="text-xs text-slate-400 mt-1 italic">Emita um novo documento para registrá-lo no histórico.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-orange-600">
                                                    {doc.hash_code}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                    {new Date(doc.issue_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                                                    {doc.recipient_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <span className="flex items-center gap-1.5 text-slate-600">
                                                        {getDocumentIcon(doc.document_type, 16)}
                                                        {getDocumentLabel(doc.document_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {doc.metadata?.signer_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                toast.info('Para reimprimir, selecione o membro na aba Emitir.');
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                                            title="Reimprimir Documento"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setDocToDelete(doc);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Excluir Histórico"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'emitir' && !selectedDocType && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h2 className="text-lg font-bold text-slate-800">Selecione o tipo de documento que deseja emitir</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { type: 'member_card', title: 'Cartão de Membro', desc: 'Crachá de identificação frente e verso com foto do membro e QR Code de validação.', icon: <CreditCard size={32} className="text-orange-500" /> },
                                { type: 'recommendation', title: 'Carta de Recomendação', desc: 'Documento oficial recomendando a transferência ou trânsito do membro para outra congregação.', icon: <FileText size={32} className="text-blue-500" /> },
                                { type: 'baptism_cert', title: 'Certificado de Batismo', desc: 'Certificado de batismo com design clássico e elegante em folha A4 paisagem.', icon: <Award size={32} className="text-amber-500" /> },
                                { type: 'presentation_cert', title: 'Certificado de Apresentação', desc: 'Documento de apresentação de crianças aos pés do Senhor com design estilizado.', icon: <Sparkles size={32} className="text-indigo-500" /> },
                                { type: 'course_cert', title: 'Certificado de Conclusão / Curso', desc: 'Certificado oficial para conclusão de aulas de discipulado, formação de líderes ou batismo.', icon: <BookOpen size={32} className="text-emerald-500" /> },
                            ].map((card) => (
                                <button
                                    key={card.type}
                                    onClick={() => handleOpenTypeForm(card.type as any)}
                                    className="p-6 bg-white border border-gray-200 rounded-3xl text-left hover:shadow-xl hover:border-orange-500/20 transition-all flex flex-col gap-4 group"
                                >
                                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-orange-50 transition-colors w-fit">
                                        {card.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg group-hover:text-orange-600 transition-colors">{card.title}</h3>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'emitir' && selectedDocType && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
                        {/* Form controls */}
                        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                            <button
                                onClick={() => setSelectedDocType(null)}
                                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Voltar aos Tipos
                            </button>

                            <div>
                                <h2 className="text-xl font-black text-slate-800">Emissão: {getDocumentLabel(selectedDocType)}</h2>
                                <p className="text-xs text-slate-500 mt-1">Preencha os campos abaixo para atualizar o preview do documento.</p>
                            </div>

                            <form onSubmit={handleGeneratePDF} className="space-y-4">
                                {/* Autocomplete Member Selector if applicable */}
                                {selectedDocType !== 'presentation_cert' && (
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pesquisar Membro</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Digite o nome do membro..."
                                                value={memberSearchTerm}
                                                onChange={(e) => {
                                                    setMemberSearchTerm(e.target.value);
                                                    setShowMemberDropdown(true);
                                                }}
                                                onFocus={() => setShowMemberDropdown(true)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            />
                                        </div>
                                        {showMemberDropdown && memberSearchTerm.length > 0 && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-50">
                                                {filteredMembers.slice(0, 5).map(m => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => handleSelectMember(m)}
                                                        className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3"
                                                    >
                                                        <img 
                                                            src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`} 
                                                            alt="" 
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <p className="font-bold">{m.name}</p>
                                                            <p className="text-xs text-slate-400">{m.memberCode || 'Código indisponível'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                                {filteredMembers.length === 0 && (
                                                    <p className="p-3 text-xs text-center text-gray-400 italic">Nenhum membro encontrado</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rest of specific forms */}
                                {selectedDocType === 'member_card' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Expiração</label>
                                        <input
                                            type="date"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                        />
                                    </div>
                                )}

                                {selectedDocType === 'recommendation' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Igreja de Destino</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Assembleia de Deus Central de Benguela"
                                                value={formData.dest_church}
                                                onChange={(e) => setFormData({ ...formData, dest_church: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Validade da Carta (Dias)</label>
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedDocType === 'baptism_cert' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Batismo</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.baptism_date}
                                                    onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Celebrante</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.celebrant}
                                                    onChange={(e) => setFormData({ ...formData, celebrant: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Local do Batismo</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Rio Kwanza / Batistério da Catedral"
                                                value={formData.baptism_place}
                                                onChange={(e) => setFormData({ ...formData, baptism_place: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedDocType === 'presentation_cert' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Criança</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Samuel Silva Neto"
                                                value={formData.child_name}
                                                onChange={(e) => setFormData({ ...formData, child_name: e.target.value, recipient_name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Nascimento</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.birth_date}
                                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data Apresentação</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.presentation_date}
                                                    onChange={(e) => setFormData({ ...formData, presentation_date: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Pai</label>
                                                <input
                                                    type="text"
                                                    value={formData.father_name}
                                                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Mãe</label>
                                                <input
                                                    type="text"
                                                    value={formData.mother_name}
                                                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pastor Apresentador</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.officiating_pastor}
                                                onChange={(e) => setFormData({ ...formData, officiating_pastor: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedDocType === 'course_cert' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Curso / Formação</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Treinamento de Novos Líderes de Célula"
                                                value={formData.course_name}
                                                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Carga Horária (Horas)</label>
                                                <input
                                                    type="number"
                                                    value={formData.course_hours}
                                                    onChange={(e) => setFormData({ ...formData, course_hours: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data Conclusão</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.completion_date}
                                                    onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Instrutor / Formador</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.instructor}
                                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notas Adicionais / Observação</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800 h-20"
                                        placeholder="Opcional..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                                    {isGenerating ? 'Processando Documento...' : 'Gerar e Emitir PDF'}
                                </button>
                            </form>
                        </div>

                        {/* Interactive Preview panel */}
                        <div className="lg:col-span-7 space-y-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles size={16} className="text-orange-500 animate-pulse" />
                                Visualização da Impressão (Preview)
                            </h3>

                            <div className="bg-slate-200 p-6 rounded-3xl border border-gray-300/60 flex items-center justify-center min-h-[400px] overflow-auto shadow-inner">
                                {/* Wrapper element captured by html2canvas */}
                                <div 
                                    ref={printContainerRef} 
                                    className={`bg-white shadow-2xl transition-all duration-300 origin-center ${
                                        selectedDocType === 'member_card' 
                                            ? 'w-full max-w-[420px] bg-transparent shadow-none border-none p-0 flex flex-col gap-4' 
                                            : selectedDocType === 'recommendation'
                                                ? 'w-[210mm] min-h-[297mm] p-[20mm] text-slate-800 font-serif' // A4 Portrait style
                                                : 'w-[297mm] min-h-[210mm] p-[15mm] text-slate-800 relative font-serif' // A4 Landscape style
                                    }`}
                                >
                                    {selectedDocType === 'member_card' && (
                                        <>
                                            {/* Front Side */}
                                            <div className="card-front w-[85.6mm] h-[54mm] bg-gradient-to-br from-slate-850 to-slate-950 text-white rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-700 shadow-md shrink-0">
                                                <div className="flex justify-between items-start z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center font-black text-xs">Tr</div>
                                                        <div>
                                                            <h4 className="text-[9px] font-black uppercase tracking-wider">{user?.churchName || 'Igreja Local'}</h4>
                                                            <p className="text-[6px] text-slate-400">Cartão de Membro</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-orange-500 rounded-full text-[6px] font-black uppercase tracking-widest">Ativo</span>
                                                </div>

                                                <div className="flex gap-3 items-center z-10">
                                                    <img 
                                                        src={selectedMember?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.recipient_name || 'M')}&background=f97316&color=fff`} 
                                                        alt="" 
                                                        className="w-16 h-16 rounded-full border border-slate-700 object-cover shrink-0"
                                                    />
                                                    <div className="overflow-hidden">
                                                        <h5 className="font-black text-[12px] tracking-wide truncate">{formData.recipient_name || 'Nome do Membro'}</h5>
                                                        <p className="text-[7px] text-orange-400 font-bold uppercase mt-0.5">{selectedMember?.churchRole || 'Membro do Corpo'}</p>
                                                        <p className="text-[7px] text-slate-400 font-mono mt-1">Cód: {selectedMember?.memberCode || 'M000'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end text-[6px] text-slate-400 z-10 border-t border-slate-800/60 pt-1.5">
                                                    <div>
                                                        <span className="block font-bold text-[5px]">MEMBRO DESDE</span>
                                                        <span className="font-mono text-slate-300">
                                                            {selectedMember?.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block font-bold text-[5px]">EXPIRA EM</span>
                                                        <span className="font-mono text-slate-300">{new Date(formData.expiry_date).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>

                                                {/* Decorative background shapes */}
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
                                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-slate-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
                                            </div>

                                            {/* Back Side */}
                                            <div className="card-back w-[85.6mm] h-[54mm] bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-700 shadow-md shrink-0">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 text-[7px] text-slate-300 space-y-1">
                                                        <p><span className="font-black text-[6px] text-slate-400">BI:</span> {selectedMember?.biNumber || 'N/A'}</p>
                                                        <p><span className="font-black text-[6px] text-slate-400">NASCIMENTO:</span> {selectedMember?.birthDate ? new Date(selectedMember.birthDate).toLocaleDateString() : 'N/A'}</p>
                                                        <p><span className="font-black text-[6px] text-slate-400">BATISMO:</span> {selectedMember?.baptismDate ? new Date(selectedMember.baptismDate).toLocaleDateString() : 'N/A'}</p>
                                                        <p><span className="font-black text-[6px] text-slate-400">TELEFONE:</span> {selectedMember?.phone || 'N/A'}</p>
                                                    </div>
                                                    
                                                    {/* QR Code validation */}
                                                    <div className="shrink-0 bg-white p-1 rounded-lg">
                                                        <img 
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRONUS-VERIFY-${previewDocData?.hashCode || 'VALID'}`}
                                                            alt="QR Code" 
                                                            className="w-12 h-12"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center border-t border-slate-800/80 pt-2">
                                                    {configData.signature_url ? (
                                                        <img src={configData.signature_url} alt="" className="h-6 max-w-[60px] object-contain opacity-80" />
                                                    ) : (
                                                        <div className="h-6 flex items-end"><p className="text-[5px] text-slate-500 font-mono">Assinatura Manual</p></div>
                                                    )}
                                                    <span className="block border-t border-slate-700 w-32 mt-0.5"></span>
                                                    <p className="text-[5px] text-slate-400 tracking-wider mt-0.5">{configData.signer_name || 'PASTOR PRESIDENTE'}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedDocType === 'recommendation' && (
                                        <div className="p-4 flex flex-col justify-between min-h-[250mm] w-full relative">
                                            {/* Timbre Header */}
                                            <div className="flex items-center justify-between border-b-4 border-slate-800 pb-6 mb-8 mt-2">
                                                <div className="flex flex-col">
                                                    <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-wider uppercase">{user?.churchName || 'Igreja Evangélica'}</h1>
                                                    <p className="text-sm font-bold text-slate-500 mt-1">{configData.certificate_subtitle}</p>
                                                </div>
                                                <div className="text-right text-xs text-slate-500 font-sans">
                                                    <p>{user?.email || 'contato@igreja.org'}</p>
                                                    <p>{user?.phone || 'Telefone'}</p>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <div className="text-center my-8">
                                                <h2 className="text-2xl font-black tracking-widest text-slate-900 uppercase underline decoration-2 underline-offset-8">
                                                    Carta de Recomendação
                                                </h2>
                                            </div>

                                            {/* Letter Body */}
                                            <div className="text-justify text-base leading-relaxed space-y-6 text-slate-800 px-6 font-serif">
                                                <p className="indent-12">
                                                    Amados irmãos em Cristo Jesus, da <strong>{formData.dest_church || '__________________________________'}</strong>.
                                                </p>
                                                <p className="indent-12">
                                                    Saudações no Senhor Jesus Cristo.
                                                </p>
                                                <p className="indent-12">
                                                    Pela presente, apresentamos e recomendamos à vossa comunhão cristã o(a) nosso(a) amado(a) irmão(ã) <strong>{formData.recipient_name || 'Nome do Membro'}</strong>, portador(a) do código <strong>{selectedMember?.memberCode || 'M000'}</strong>, membro ativo e de boa conduta cristã nesta congregação.
                                                </p>
                                                <p className="indent-12">
                                                    O(A) referido(a) irmão(ã) está em plena comunhão espiritual, desempenhando as suas atividades de acordo com a sã doutrina. Solicitamos que o(a) recebam no amor do Senhor, dando-lhe o apoio necessário na sua caminhada de fé.
                                                </p>
                                                {formData.notes && (
                                                    <p className="indent-12 text-slate-600 italic">
                                                        "Observações: {formData.notes}"
                                                    </p>
                                                )}
                                                <p className="indent-12">
                                                    Esta carta é válida por 90 dias a contar da data de sua emissão.
                                                </p>
                                            </div>

                                            {/* Footer Dates */}
                                            <div className="text-right px-6 mt-16 font-sans text-sm text-slate-500">
                                                <p>Luanda, aos {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
                                            </div>

                                            {/* Signature and Hash */}
                                            <div className="flex flex-col items-center mt-20 gap-2 font-sans">
                                                {configData.signature_url ? (
                                                    <img src={configData.signature_url} alt="Assinatura" className="h-16 max-w-[200px] object-contain" />
                                                ) : (
                                                    <div className="h-16 flex items-end text-slate-400 italic text-xs">Assinatura do Pastor</div>
                                                )}
                                                <span className="block border-t border-slate-300 w-64"></span>
                                                <h4 className="font-bold text-slate-800 text-sm">{configData.signer_name || 'Nome do Pastor'}</h4>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest">{configData.signer_role || 'Presidente'}</p>
                                                
                                                <div className="mt-12 text-[8px] text-slate-400 font-mono text-center">
                                                    Código de Validação: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDocType === 'baptism_cert' && (
                                        <div className="w-full h-full border-8 border-double border-amber-800 p-8 flex flex-col justify-between min-h-[175mm] relative">
                                            {/* Header */}
                                            <div className="text-center font-sans">
                                                <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest">{user?.churchName || 'Igreja Local'}</h4>
                                                <h3 className="text-xs font-bold text-slate-500 mt-1">{configData.certificate_subtitle}</h3>
                                            </div>

                                            {/* Certificate Title */}
                                            <div className="text-center my-6">
                                                <h1 className="font-black text-4xl text-amber-900 tracking-wider font-serif uppercase">
                                                    Certificado de Batismo
                                                </h1>
                                                <div className="w-32 h-1 bg-amber-800 mx-auto mt-2 rounded-full"></div>
                                            </div>

                                            {/* Certificate Content Text */}
                                            <div className="text-center text-lg leading-loose px-12 text-slate-800 font-serif max-w-[220mm] mx-auto">
                                                Certificamos que o(a) irmão(ã) <strong className="text-2xl text-slate-900 italic font-black">{formData.recipient_name || 'Nome do Membro'}</strong>, 
                                                tendo aceitado ao Senhor Jesus Cristo como seu único e suficiente Salvador, foi sepultado(a) com Ele por meio do Batismo nas águas 
                                                no dia <strong className="text-slate-900">{formData.baptism_date ? new Date(formData.baptism_date).toLocaleDateString('pt-BR') : '___/___/______'}</strong>, 
                                                em <strong className="text-slate-900">{formData.baptism_place || '____________________'}</strong>, pelo celebrante <strong className="text-slate-900">{formData.celebrant || '____________________'}</strong>, 
                                                segundo o mandamento de Mateus 28:19.
                                            </div>

                                            {/* Signature and Stamps block */}
                                            <div className="grid grid-cols-2 mt-12 px-24 items-end font-sans">
                                                <div className="flex flex-col items-center">
                                                    <span className="block border-t border-slate-300 w-48 mt-16"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{formData.celebrant || 'Ministrante'}</p>
                                                    <p className="text-[10px] text-slate-400">Celebrante</p>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    {configData.signature_url ? (
                                                        <img src={configData.signature_url} alt="" className="h-10 max-w-[150px] object-contain" />
                                                    ) : (
                                                        <div className="h-10"></div>
                                                    )}
                                                    <span className="block border-t border-slate-300 w-48"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{configData.signer_name || 'Nome do Pastor'}</p>
                                                    <p className="text-[10px] text-slate-400">{configData.signer_role || 'Pastor Presidente'}</p>
                                                </div>
                                            </div>

                                            {/* Validation hash */}
                                            <div className="text-[8px] text-slate-400 font-mono text-center mt-6">
                                                Cód. Autenticidade: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                            </div>

                                            {/* Background vintage badge decoration */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-amber-900/10 rounded-full flex items-center justify-center pointer-events-none -z-10">
                                                <Award size={96} className="text-amber-900/[0.03]" />
                                            </div>
                                        </div>
                                    )}

                                    {selectedDocType === 'presentation_cert' && (
                                        <div className="w-full h-full border-8 border-double border-indigo-800 p-8 flex flex-col justify-between min-h-[175mm] relative">
                                            <div className="text-center font-sans">
                                                <h4 className="text-sm font-black text-indigo-850 uppercase tracking-widest">{user?.churchName || 'Igreja Local'}</h4>
                                                <h3 className="text-xs font-bold text-slate-500 mt-1">{configData.certificate_subtitle}</h3>
                                            </div>

                                            <div className="text-center my-6">
                                                <h1 className="font-black text-4xl text-indigo-900 tracking-wider font-serif uppercase">
                                                    Certificado de Apresentação
                                                </h1>
                                                <div className="w-32 h-1 bg-indigo-800 mx-auto mt-2 rounded-full"></div>
                                            </div>

                                            <div className="text-center text-lg leading-loose px-12 text-slate-800 font-serif max-w-[220mm] mx-auto">
                                                Certificamos que a criança <strong className="text-2xl text-slate-900 italic font-black">{formData.child_name || 'Nome da Criança'}</strong>, 
                                                nascida no dia <strong className="text-slate-900">{formData.birth_date ? new Date(formData.birth_date).toLocaleDateString('pt-BR') : '___/___/______'}</strong>, 
                                                filho(a) de <strong className="text-slate-900">{formData.father_name || 'Nome do Pai'}</strong> e de <strong className="text-slate-900">{formData.mother_name || 'Nome da Mãe'}</strong>, 
                                                foi apresentada ao Senhor Jesus Cristo em culto público no dia <strong className="text-slate-900">{formData.presentation_date ? new Date(formData.presentation_date).toLocaleDateString('pt-BR') : '___/___/______'}</strong>, 
                                                pelo Pastor <strong className="text-slate-900">{formData.officiating_pastor || '____________________'}</strong>, 
                                                em conformidade com o exemplo bíblico de Lucas 2:22.
                                            </div>

                                            <div className="grid grid-cols-2 mt-12 px-24 items-end font-sans">
                                                <div className="flex flex-col items-center">
                                                    <span className="block border-t border-slate-300 w-48 mt-16"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{formData.father_name || 'Nome do Pai'} / {formData.mother_name || 'Mãe'}</p>
                                                    <p className="text-[10px] text-slate-400">Pais / Encarregados</p>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    {configData.signature_url ? (
                                                        <img src={configData.signature_url} alt="" className="h-10 max-w-[150px] object-contain" />
                                                    ) : (
                                                        <div className="h-10"></div>
                                                    )}
                                                    <span className="block border-t border-slate-300 w-48"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{configData.signer_name || 'Nome do Pastor'}</p>
                                                    <p className="text-[10px] text-slate-400">{configData.signer_role || 'Pastor Apresentador'}</p>
                                                </div>
                                            </div>

                                            <div className="text-[8px] text-slate-400 font-mono text-center mt-6">
                                                Cód. Autenticidade: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                            </div>

                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-indigo-900/10 rounded-full flex items-center justify-center pointer-events-none -z-10">
                                                <Sparkles size={96} className="text-indigo-900/[0.03]" />
                                            </div>
                                        </div>
                                    )}

                                    {selectedDocType === 'course_cert' && (
                                        <div className="w-full h-full border-8 border-double border-emerald-800 p-8 flex flex-col justify-between min-h-[175mm] relative">
                                            <div className="text-center font-sans">
                                                <h4 className="text-sm font-black text-emerald-850 uppercase tracking-widest">{user?.churchName || 'Igreja Local'}</h4>
                                                <h3 className="text-xs font-bold text-slate-500 mt-1">{configData.certificate_subtitle}</h3>
                                            </div>

                                            <div className="text-center my-6">
                                                <h1 className="font-black text-4xl text-emerald-900 tracking-wider font-serif uppercase">
                                                    Certificado de Conclusão
                                                </h1>
                                                <div className="w-32 h-1 bg-emerald-800 mx-auto mt-2 rounded-full"></div>
                                            </div>

                                            <div className="text-center text-lg leading-loose px-12 text-slate-800 font-serif max-w-[220mm] mx-auto">
                                                Certificamos que o(a) amado(a) irmão(ã) <strong className="text-2xl text-slate-900 italic font-black">{formData.recipient_name || 'Nome do Aluno'}</strong> concluiu com sucesso 
                                                o curso/formação de <strong className="text-slate-900">{formData.course_name || '____________________'}</strong>, realizado no dia <strong className="text-slate-900">{formData.completion_date ? new Date(formData.completion_date).toLocaleDateString('pt-BR') : '___/___/______'}</strong>, 
                                                com carga horária total de <strong className="text-slate-900">{formData.course_hours || '0'} horas</strong> ministradas pelo instrutor <strong className="text-slate-900">{formData.instructor || '____________________'}</strong>.
                                            </div>

                                            <div className="grid grid-cols-2 mt-12 px-24 items-end font-sans">
                                                <div className="flex flex-col items-center">
                                                    <span className="block border-t border-slate-300 w-48 mt-16"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{formData.instructor || 'Formador'}</p>
                                                    <p className="text-[10px] text-slate-400">Instrutor</p>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    {configData.signature_url ? (
                                                        <img src={configData.signature_url} alt="" className="h-10 max-w-[150px] object-contain" />
                                                    ) : (
                                                        <div className="h-10"></div>
                                                    )}
                                                    <span className="block border-t border-slate-300 w-48"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{configData.signer_name || 'Nome do Pastor'}</p>
                                                    <p className="text-[10px] text-slate-400">{configData.signer_role || 'Pastor Presidente'}</p>
                                                </div>
                                            </div>

                                            <div className="text-[8px] text-slate-400 font-mono text-center mt-6">
                                                Cód. Autenticidade: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                            </div>

                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-emerald-900/10 rounded-full flex items-center justify-center pointer-events-none -z-10">
                                                <BookOpen size={96} className="text-emerald-900/[0.03]" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Assinaturas e Configurações</h2>
                            <p className="text-sm text-slate-500">Configure as assinaturas e o cabeçalho padrão para os certificados e cartas emitidos.</p>
                        </div>

                        <form onSubmit={handleSaveConfig} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pastor / Assinante Oficial</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Pr. António Mateus"
                                    value={configData.signer_name}
                                    onChange={(e) => setConfigData({ ...configData, signer_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cargo / Função do Assinante</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Pastor Presidente"
                                    value={configData.signer_role}
                                    onChange={(e) => setConfigData({ ...configData, signer_role: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtítulo / Ministério Local</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Catedral da Fé / Ministério Ebenezer"
                                    value={configData.certificate_subtitle}
                                    onChange={(e) => setConfigData({ ...configData, certificate_subtitle: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Assinatura Digitalizada</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-4 bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
                                    {configData.signature_url ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={configData.signature_url} alt="Assinatura atual" className="h-16 object-contain" />
                                            <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                <CheckCircle2 size={14} /> Assinatura carregada e ativa
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 space-y-1">
                                            <Upload className="mx-auto text-slate-300" size={32} />
                                            <p className="text-xs font-bold">Faça upload da imagem de assinatura</p>
                                            <p className="text-[10px] text-slate-400">Recomendado: arquivo PNG transparente</p>
                                        </div>
                                    )}

                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleSignatureUpload}
                                        disabled={uploadingSign}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    {uploadingSign && (
                                        <div className="absolute inset-0 bg-white/85 flex items-center justify-center rounded-2xl">
                                            <Loader2 className="animate-spin text-orange-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200"
                            >
                                Salvar Configurações
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Custom confirmation generic delete modal */}
            {isDeleteModalOpen && docToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <Trash2 size={24} />
                            <h3 className="text-lg font-bold text-slate-800">Confirmar Exclusão</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Tem certeza que deseja excluir o histórico de emissão deste documento? O registro de <strong>{docToDelete.recipient_name}</strong> será apagado permanentemente.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                            >
                                Confirmar e Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
