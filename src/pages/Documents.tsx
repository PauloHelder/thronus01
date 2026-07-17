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
        certificate_subtitle: 'Catedral da Fé',
        church_phone: '',
        church_email: '',
        church_address: '',
        church_province: '',
        church_country: '',
        signatures: [] as { id: string; name: string; role: string; url: string }[]
    });
    const [uploadingSign, setUploadingSign] = useState(false);

    // Signature Modal and Form States
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [editingSignature, setEditingSignature] = useState<{ id: string; name: string; role: string; url: string } | null>(null);
    const [sigFormName, setSigFormName] = useState('');
    const [sigFormRole, setSigFormRole] = useState('');
    const [sigFormFile, setSigFormFile] = useState<File | null>(null);
    const [sigFormPreviewUrl, setSigFormPreviewUrl] = useState('');
    const [uploadingSigForm, setUploadingSigForm] = useState(false);

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
        card_orientation: 'horizontal',
        selected_signature_id: '',
        card_role: '',
        card_title: '',
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

    // Format name to show first and last name only
    const getFirstAndLastName = (fullName: string) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length <= 2) return fullName;
        return `${parts[0]} ${parts[parts.length - 1]}`;
    };

    // Render church logo if custom exists, else show initials placeholder
    const renderChurchLogo = () => {
        if (configData.custom_logo_url) {
            return (
                <img 
                    src={configData.custom_logo_url} 
                    alt="Logo" 
                    className="w-7 h-7 object-contain rounded-lg border border-slate-100 bg-white" 
                />
            );
        }
        return (
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm">
                {user?.churchName ? user.churchName.substring(0, 2).toUpperCase() : 'Tr'}
            </div>
        );
    };

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
                certificate_subtitle: settings.certificate_subtitle || user?.churchName || '',
                church_phone: settingsObj.phone || '',
                church_email: settingsObj.email || '',
                church_address: settingsObj.address || '',
                church_province: settingsObj.province || '',
                church_country: settingsObj.country || '',
                signatures: settings.signatures || []
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

    const getActiveSignature = () => {
        if (formData.selected_signature_id) {
            const found = (configData.signatures || []).find(s => s.id === formData.selected_signature_id);
            if (found) return found;
        }
        return {
            id: 'legacy',
            name: configData.signer_name || 'PASTOR PRESIDENTE',
            role: configData.signer_role || '',
            url: configData.signature_url || ''
        };
    };

    const handleSigFormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSigFormFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setSigFormPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveSignature = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sigFormName.trim() || !sigFormRole.trim()) {
            toast.error('Por favor, preencha o nome e o cargo.');
            return;
        }

        if (!editingSignature && !sigFormFile) {
            toast.error('Por favor, selecione a imagem da assinatura.');
            return;
        }

        setUploadingSigForm(true);
        const toastId = toast.loading(editingSignature ? 'Atualizando assinatura...' : 'Enviando imagem da assinatura...');
        try {
            let url = editingSignature ? editingSignature.url : '';
            if (sigFormFile) {
                const uploadedUrl = await uploadSignature(sigFormFile);
                if (uploadedUrl) {
                    url = uploadedUrl;
                } else {
                    toast.error('Erro ao fazer upload do arquivo.', { id: toastId });
                    setUploadingSigForm(false);
                    return;
                }
            }

            let updatedSignatures = [];
            if (editingSignature) {
                updatedSignatures = (configData.signatures || []).map(s => 
                    s.id === editingSignature.id 
                        ? { ...s, name: sigFormName.trim(), role: sigFormRole.trim(), url } 
                        : s
                );
            } else {
                const newSignature = {
                    id: crypto.randomUUID(),
                    name: sigFormName.trim(),
                    role: sigFormRole.trim(),
                    url
                };
                updatedSignatures = [...(configData.signatures || []), newSignature];
            }

            const success = await updateChurchSettings({
                signatures: updatedSignatures
            });

            if (success) {
                setConfigData(prev => ({ ...prev, signatures: updatedSignatures }));
                setIsSignatureModalOpen(false);
                setEditingSignature(null);
                setSigFormName('');
                setSigFormRole('');
                setSigFormFile(null);
                setSigFormPreviewUrl('');
                toast.success(editingSignature ? 'Assinatura atualizada com sucesso!' : 'Assinatura adicionada com sucesso!', { id: toastId });
            } else {
                toast.error('Erro ao salvar no banco de dados.', { id: toastId });
            }
        } catch (err) {
            console.error('Error saving signature:', err);
            toast.error('Erro no processamento da assinatura.', { id: toastId });
        } finally {
            setUploadingSigForm(false);
        }
    };

    const handleDeleteSignature = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta assinatura?')) return;
        const updatedSignatures = (configData.signatures || []).filter(s => s.id !== id);
        const success = await updateChurchSettings({
            signatures: updatedSignatures
        });
        if (success) {
            setConfigData(prev => ({ ...prev, signatures: updatedSignatures }));
            if (formData.selected_signature_id === id) {
                setFormData(prev => ({ ...prev, selected_signature_id: '' }));
            }
            toast.success('Assinatura removida com sucesso!');
        } else {
            toast.error('Erro ao excluir assinatura.');
        }
    };

    const openAddSignatureModal = () => {
        setEditingSignature(null);
        setSigFormName('');
        setSigFormRole('');
        setSigFormFile(null);
        setSigFormPreviewUrl('');
        setIsSignatureModalOpen(true);
    };

    const openEditSignatureModal = (sig: { id: string; name: string; role: string; url: string }) => {
        setEditingSignature(sig);
        setSigFormName(sig.name);
        setSigFormRole(sig.role);
        setSigFormPreviewUrl(sig.url);
        setSigFormFile(null);
        setIsSignatureModalOpen(true);
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
            celebrant: prev.celebrant || configData.signer_name,
            card_role: member.ecclesiasticalFunctions && member.ecclesiasticalFunctions.length > 0 
                ? member.ecclesiasticalFunctions.join(', ') 
                : (member.churchRole || 'Membro'),
            card_title: member.ecclesiasticalTitles && member.ecclesiasticalTitles.length > 0 
                ? member.ecclesiasticalTitles.join(', ') 
                : (member.churchRole || 'Membro')
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
            // Calculate sequential order number for this document type (recommendation, baptism_cert, etc.)
            const sameTypeDocs = documents.filter(d => d.document_type === selectedDocType);
            const docNumber = sameTypeDocs.length + 1;
            const formattedDocNumber = String(docNumber).padStart(3, '0');

            const hashCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            
            // Build preview mock info
            const previewData = {
                hashCode,
                issue_date: new Date().toLocaleDateString('pt-BR'),
                ...formData,
                recipient_name: rName,
                metadata: {
                    notes: formData.notes || '',
                    signer_name: configData.signer_name,
                    signer_role: configData.signer_role,
                    hashCode,
                    issuer_name: user?.fullName || 'Sistema',
                    doc_number: formattedDocNumber
                }
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
                const isVertical = formData.card_orientation === 'vertical';
                const cardWidth = isVertical ? 54 : 85.6;
                const cardHeight = isVertical ? 85.6 : 54;
                const cardPdfOrientation = isVertical ? 'portrait' : 'landscape';

                // Member Card: Credit card dimensions -> Standard ID-1
                // We add two pages: Page 1 (Frente), Page 2 (Verso)
                pdf = new jsPDF({
                    orientation: cardPdfOrientation,
                    unit: 'mm',
                    format: [cardWidth, cardHeight]
                });

                // Front side capture
                const frontCanvas = await html2canvas(printElement.querySelector('.card-front') as HTMLDivElement, {
                    scale: 3.5,
                    useCORS: true
                });
                const frontImg = frontCanvas.toDataURL('image/png');
                pdf.addImage(frontImg, 'PNG', 0, 0, cardWidth, cardHeight);

                // Back side capture
                pdf.addPage([cardWidth, cardHeight], cardPdfOrientation);
                const backCanvas = await html2canvas(printElement.querySelector('.card-back') as HTMLDivElement, {
                    scale: 3.5,
                    useCORS: true
                });
                const backImg = backCanvas.toDataURL('image/png');
                pdf.addImage(backImg, 'PNG', 0, 0, cardWidth, cardHeight);

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
                    hashCode,
                    issuer_name: user?.fullName || 'Sistema',
                    doc_number: formattedDocNumber
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

    const getDocumentSequenceNumber = (doc: any) => {
        const sameTypeDocs = documents.filter(d => d.document_type === doc.document_type);
        const sorted = [...sameTypeDocs].sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.issue_date ? new Date(a.issue_date).getTime() : 0);
            const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.issue_date ? new Date(b.issue_date).getTime() : 0);
            return timeA - timeB;
        });
        const index = sorted.findIndex(s => s.id === doc.id);
        const sequenceNum = index !== -1 ? index + 1 : sameTypeDocs.length + 1;
        return String(sequenceNum).padStart(3, '0');
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

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                                                    #{doc.metadata?.doc_number || getDocumentSequenceNumber(doc)} <span className="text-slate-400 font-normal">({doc.hash_code})</span>
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
                                                            src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`} 
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
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Orientação do Cartão</label>
                                            <select
                                                value={formData.card_orientation || 'horizontal'}
                                                onChange={(e) => setFormData({ ...formData, card_orientation: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            >
                                                <option value="horizontal">Horizontal (Deitado)</option>
                                                <option value="vertical">Vertical (Em pé)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Função (Cargo)</label>
                                            <input
                                                type="text"
                                                value={formData.card_role || ''}
                                                onChange={(e) => setFormData({ ...formData, card_role: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                placeholder="Ex: Membro, Diácono, Coordenador"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Título Ministerial</label>
                                            <input
                                                type="text"
                                                value={formData.card_title || ''}
                                                onChange={(e) => setFormData({ ...formData, card_title: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                                placeholder="Ex: Irmão, Pastor, Presbítero"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Expiração</label>
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                            />
                                        </div>
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assinatura do Documento</label>
                                    <select
                                        value={formData.selected_signature_id || ''}
                                        onChange={(e) => setFormData({ ...formData, selected_signature_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                    >
                                        <option value="">Assinatura Padrão / Legada ({configData.signer_name || 'Pastor Presidente'})</option>
                                        {(configData.signatures || []).map(sig => (
                                            <option key={sig.id} value={sig.id}>
                                                {sig.name} ({sig.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                            {formData.card_orientation === 'vertical' ? (
                                                <>
                                                    {/* Vertical Front Side */}
                                                    <div className="card-front w-[54mm] h-[85.6mm] bg-gradient-to-br from-white to-slate-50 text-slate-800 rounded-2xl p-4 flex flex-col relative overflow-hidden border border-slate-200 shadow-md shrink-0 mx-auto">
                                                        <div className="flex flex-col items-center text-center z-10">
                                                            {renderChurchLogo()}
                                                            <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-800 mt-1.5 leading-tight max-w-[48mm] truncate">
                                                                {user?.churchName || 'Igreja Local'}
                                                            </h4>
                                                            <p className="text-[5.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Cartão de Membro</p>
                                                        </div>

                                                        <div className="flex justify-center my-3 z-10">
                                                            <img 
                                                                src={selectedMember?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.recipient_name || 'M')}&background=f97316&color=fff`} 
                                                                alt="" 
                                                                className="w-16 h-16 rounded-2xl border border-slate-200 object-cover shadow-md shrink-0"
                                                            />
                                                        </div>

                                                        <div className="text-center z-10 overflow-hidden space-y-0.5 px-1">
                                                            <h5 className="font-black text-[11px] tracking-wide truncate text-slate-900 leading-tight">
                                                                {getFirstAndLastName(formData.recipient_name || 'Nome do Membro')}
                                                            </h5>
                                                            <p className="text-[7px] text-orange-600 font-black uppercase leading-tight">
                                                                {formData.card_title || 'Membro'}
                                                            </p>
                                                            <p className="text-[6.5px] text-slate-500 font-bold uppercase tracking-wide leading-tight">
                                                                Cargo: {formData.card_role || 'Membro'}
                                                            </p>
                                                            <p className="text-[6px] text-slate-400 font-mono mt-0.5">Cód: {selectedMember?.memberCode || 'M000'}</p>
                                                            <p className="text-[5.5px] text-slate-500 font-bold mt-0.5">
                                                                Batizado em: <span className="font-mono text-slate-700">{selectedMember?.baptismDate ? new Date(selectedMember.baptismDate).toLocaleDateString('pt-BR') : 'N/D'}</span>
                                                            </p>
                                                        </div>

                                                        <div className="flex justify-between items-end text-[5.5px] text-slate-500 z-10 border-t border-slate-200/80 pt-1.5 mt-auto">
                                                            <div className="text-left">
                                                                <span className="block font-bold text-[4.5px] text-slate-400 uppercase">Membro Desde</span>
                                                                <span className="font-mono text-slate-700 font-bold">
                                                                    {selectedMember?.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="block font-bold text-[4.5px] text-slate-400 uppercase">Expira Em</span>
                                                                <span className="font-mono text-slate-700 font-bold">
                                                                    {formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Decorative background shapes */}
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-xl" />
                                                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-slate-500/5 rounded-full -ml-8 -mb-8 blur-lg" />
                                                    </div>

                                                    {/* Vertical Back Side */}
                                                    <div className="card-back w-[54mm] h-[85.6mm] bg-gradient-to-br from-white to-slate-50 text-slate-800 rounded-2xl p-4 flex flex-col relative overflow-hidden border border-slate-200 shadow-md shrink-0 mx-auto">
                                                        <div className="text-center">
                                                            <h4 className="font-black text-[7.5px] text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                                                                Disposições Gerais
                                                            </h4>
                                                        </div>

                                                        <div className="text-[6.2px] text-slate-600 space-y-1.5 flex-1 px-1 leading-snug">
                                                            <p><span className="font-bold text-slate-800">1.</span> Este passe é pessoal e intransferível.</p>
                                                            <p><span className="font-bold text-slate-800">2.</span> Em caso de perda deve comunicar oportunamente.</p>
                                                            <p><span className="font-bold text-slate-800">3.</span> Emitido: {selectedMember?.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                                            <p><span className="font-bold text-slate-800">4.</span> Validade: {formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString() : 'N/A'}</p>
                                                            {(configData.church_phone || configData.church_email) && (
                                                                <p className="truncate text-[5.5px] text-slate-500 mt-1 border-t border-slate-100 pt-1">
                                                                    <span className="font-bold text-slate-600">Igreja: </span>
                                                                    {configData.church_phone || configData.church_email}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1 my-2 shrink-0">
                                                            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                                                <img 
                                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRONUS-VERIFY-${previewDocData?.hashCode || 'VALID'}`}
                                                                    alt="QR Code" 
                                                                    className="w-10 h-10"
                                                                />
                                                            </div>
                                                            <p className="text-[5px] font-mono text-slate-400">Validação Online</p>
                                                        </div>

                                                        <div className="flex flex-col items-center border-t border-slate-200/80 pt-1.5 mt-auto text-center shrink-0">
                                                            {configData.signature_url ? (
                                                                <img src={configData.signature_url} alt="" className="h-6 max-w-[65px] object-contain opacity-95" />
                                                            ) : (
                                                                <div className="h-6 flex items-end"><p className="text-[5px] text-slate-400 font-mono">Assinatura do Responsável</p></div>
                                                            )}
                                                            <span className="block border-t border-slate-200/80 w-36 mt-0.5"></span>
                                                            <p className="text-[5.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate max-w-[50mm]">
                                                                {configData.signer_name || 'PASTOR PRESIDENTE'}
                                                            </p>
                                                        </div>

                                                        {/* Decorative background shapes */}
                                                        <div className="absolute top-0 left-0 w-24 h-24 bg-slate-500/5 rounded-full -ml-12 -mt-12 blur-xl" />
                                                        <div className="absolute bottom-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mr-8 -mb-8 blur-lg" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Horizontal Front Side */}
                                                    <div className="card-front w-[85.6mm] h-[54mm] bg-gradient-to-br from-white to-slate-50 text-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200 shadow-md shrink-0 mx-auto">
                                                        <div className="flex justify-between items-start z-10">
                                                            <div className="flex items-center gap-2">
                                                                {renderChurchLogo()}
                                                                <div>
                                                                    <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-800 leading-tight">
                                                                        {user?.churchName || 'Igreja Local'}
                                                                    </h4>
                                                                    <p className="text-[5.5px] text-slate-500 font-bold uppercase tracking-wider">Cartão de Membro</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3.5 items-center z-10 my-auto">
                                                            <img 
                                                                src={selectedMember?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.recipient_name || 'M')}&background=f97316&color=fff`} 
                                                                alt="" 
                                                                className="w-14 h-14 rounded-xl border border-slate-200 object-cover shrink-0 shadow-sm"
                                                            />
                                                            <div className="overflow-hidden space-y-0.5">
                                                                <h5 className="font-black text-[11px] tracking-wide truncate text-slate-900 leading-tight">
                                                                    {getFirstAndLastName(formData.recipient_name || 'Nome do Membro')}
                                                                </h5>
                                                                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                                                    <p className="text-[6.5px] text-orange-600 font-bold uppercase">
                                                                        Título: <span className="text-slate-800">{formData.card_title || 'Membro'}</span>
                                                                    </p>
                                                                    <p className="text-[6.5px] text-orange-600 font-bold uppercase">
                                                                        Função: <span className="text-slate-800">{formData.card_role || 'Membro'}</span>
                                                                    </p>
                                                                </div>
                                                                <p className="text-[6px] text-slate-400 font-mono">Cód: {selectedMember?.memberCode || 'M000'}</p>
                                                                <p className="text-[5.5px] text-slate-500 font-bold">
                                                                    Batizado em: <span className="font-mono text-slate-700">{selectedMember?.baptismDate ? new Date(selectedMember.baptismDate).toLocaleDateString('pt-BR') : 'N/D'}</span>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-end text-[6px] text-slate-500 z-10 border-t border-slate-200/80 pt-1.5 mt-auto">
                                                            <div>
                                                                <span className="block font-bold text-[5px] text-slate-400 uppercase">Membro Desde</span>
                                                                <span className="font-mono text-slate-700 font-bold">
                                                                    {selectedMember?.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="block font-bold text-[5px] text-slate-400 uppercase">Expira Em</span>
                                                                <span className="font-mono text-slate-700 font-bold">
                                                                    {formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Decorative background shapes */}
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-xl" />
                                                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-slate-500/5 rounded-full -ml-8 -mb-8 blur-lg" />
                                                    </div>

                                                    {/* Horizontal Back Side */}
                                                    <div className="card-back w-[85.6mm] h-[54mm] bg-gradient-to-br from-white to-slate-50 text-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200 shadow-md shrink-0 mx-auto">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 text-[6.5px] text-slate-600 space-y-1">
                                                                <h4 className="font-black text-[7px] text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-0.5">
                                                                    Disposições Gerais
                                                                </h4>
                                                                <p><span className="font-bold text-slate-850">1.</span> Este passe é pessoal e intransferível.</p>
                                                                <p><span className="font-bold text-slate-850">2.</span> Em caso de perda deve comunicar oportunamente.</p>
                                                                <p><span className="font-bold text-slate-850">3.</span> Emitido: {selectedMember?.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                                                <p><span className="font-bold text-slate-850">4.</span> Validade: {formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString() : 'N/A'}</p>
                                                                {(configData.church_phone || configData.church_email) && (
                                                                    <p className="truncate text-[5.5px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                                                                        <span className="font-bold text-slate-500">Contatos: </span>
                                                                        {configData.church_phone || configData.church_email}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="shrink-0 flex flex-col items-center gap-1">
                                                                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                                                    <img 
                                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRONUS-VERIFY-${previewDocData?.hashCode || 'VALID'}`}
                                                                        alt="QR Code" 
                                                                        className="w-11 h-11"
                                                                    />
                                                                </div>
                                                                <p className="text-[5px] font-mono text-slate-400">Validação Online</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center border-t border-slate-200/80 pt-1.5 mt-auto">
                                                            {configData.signature_url ? (
                                                                <img src={configData.signature_url} alt="" className="h-6 max-w-[65px] object-contain opacity-95" />
                                                            ) : (
                                                                <div className="h-6 flex items-end"><p className="text-[5px] text-slate-400 font-mono">Assinatura do Responsável</p></div>
                                                            )}
                                                            <span className="block border-t border-slate-200/80 w-36 mt-0.5"></span>
                                                            <p className="text-[5.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                                {configData.signer_name || 'PASTOR PRESIDENTE'}
                                                            </p>
                                                        </div>

                                                        {/* Decorative background shapes */}
                                                        <div className="absolute top-0 left-0 w-24 h-24 bg-slate-500/5 rounded-full -ml-12 -mt-12 blur-xl" />
                                                        <div className="absolute bottom-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mr-8 -mb-8 blur-lg" />
                                                    </div>
                                                </>
                                            )}
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
                                            <div className="text-center my-8 space-y-1">
                                                <h2 className="text-2xl font-black tracking-widest text-slate-900 uppercase underline decoration-2 underline-offset-8">
                                                    Carta de Recomendação
                                                </h2>
                                                <p className="text-xs font-mono font-bold text-slate-500 pt-2">
                                                    Ref. Nº {previewDocData?.metadata?.doc_number || getDocumentSequenceNumber({ id: 'preview', document_type: 'recommendation' })}
                                                </p>
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
                                                {getActiveSignature().url ? (
                                                    <img src={getActiveSignature().url} alt="Assinatura" className="h-16 max-w-[200px] object-contain" />
                                                ) : (
                                                    <div className="h-16 flex items-end text-slate-400 italic text-xs">Assinatura do Pastor</div>
                                                )}
                                                <span className="block border-t border-slate-300 w-64"></span>
                                                <h4 className="font-bold text-slate-800 text-sm">{getActiveSignature().name}</h4>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest">{getActiveSignature().role || 'Pastor'}</p>
                                                
                                                <div className="mt-12 text-[8px] text-slate-400 font-mono text-center">
                                                    Código de Validação: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                                </div>
                                                <div className="text-[6.5px] text-slate-350 font-mono text-center mt-1">
                                                    Emitido por: {previewDocData?.metadata?.issuer_name || user?.fullName || 'Sistema'}
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
                                            <div className="text-center my-6 space-y-1">
                                                <h1 className="font-black text-4xl text-amber-900 tracking-wider font-serif uppercase">
                                                    Certificado de Batismo
                                                </h1>
                                                <p className="text-xs font-mono font-bold text-amber-800">
                                                    Reg. Nº {previewDocData?.metadata?.doc_number || getDocumentSequenceNumber({ id: 'preview', document_type: 'baptism_cert' })}
                                                </p>
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
                                                    {getActiveSignature().url ? (
                                                        <img src={getActiveSignature().url} alt="" className="h-10 max-w-[150px] object-contain" />
                                                    ) : (
                                                        <div className="h-10"></div>
                                                    )}
                                                    <span className="block border-t border-slate-300 w-48"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{getActiveSignature().name}</p>
                                                    <p className="text-[10px] text-slate-400">{getActiveSignature().role || 'Pastor Presidente'}</p>
                                                </div>
                                            </div>

                                            {/* Validation hash */}
                                            <div className="text-[8px] text-slate-400 font-mono text-center mt-6">
                                                Cód. Autenticidade: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                            </div>
                                            <div className="text-[6.5px] text-slate-300 font-mono text-center mt-1">
                                                Emitido por: {previewDocData?.metadata?.issuer_name || user?.fullName || 'Sistema'}
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

                                            <div className="text-center my-6 space-y-1">
                                                <h1 className="font-black text-4xl text-indigo-900 tracking-wider font-serif uppercase">
                                                    Certificado de Apresentação
                                                </h1>
                                                <p className="text-xs font-mono font-bold text-indigo-800">
                                                    Reg. Nº {previewDocData?.metadata?.doc_number || getDocumentSequenceNumber({ id: 'preview', document_type: 'presentation_cert' })}
                                                </p>
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
                                                    {getActiveSignature().url ? (
                                                        <img src={getActiveSignature().url} alt="" className="h-10 max-w-[150px] object-contain" />
                                                    ) : (
                                                        <div className="h-10"></div>
                                                    )}
                                                    <span className="block border-t border-slate-300 w-48"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{getActiveSignature().name}</p>
                                                    <p className="text-[10px] text-slate-400">{getActiveSignature().role || 'Pastor'}</p>
                                                </div>
                                            </div>

                                            <div className="text-[8px] text-slate-400 font-mono text-center mt-6">
                                                Cód. Autenticidade: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                            </div>
                                            <div className="text-[6.5px] text-slate-300 font-mono text-center mt-1">
                                                Emitido por: {previewDocData?.metadata?.issuer_name || user?.fullName || 'Sistema'}
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

                                            <div className="text-center my-6 space-y-1">
                                                <h1 className="font-black text-4xl text-emerald-900 tracking-wider font-serif uppercase">
                                                    Certificado de Conclusão
                                                </h1>
                                                <p className="text-xs font-mono font-bold text-emerald-850">
                                                    Reg. Nº {previewDocData?.metadata?.doc_number || getDocumentSequenceNumber({ id: 'preview', document_type: 'course_cert' })}
                                                </p>
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
                                                    {getActiveSignature().url ? (
                                                        <img src={getActiveSignature().url} alt="" className="h-10 max-w-[150px] object-contain" />
                                                    ) : (
                                                        <div className="h-10"></div>
                                                    )}
                                                    <span className="block border-t border-slate-300 w-48"></span>
                                                    <p className="text-xs font-bold text-slate-700 mt-1">{getActiveSignature().name}</p>
                                                    <p className="text-[10px] text-slate-400">{getActiveSignature().role || 'Pastor Presidente'}</p>
                                                </div>
                                            </div>

                                            <div className="text-[8px] text-slate-400 font-mono text-center mt-6">
                                                Cód. Autenticidade: {previewDocData?.hashCode || 'TRN-XXXXXX-XXXX'}
                                            </div>
                                            <div className="text-[6.5px] text-slate-300 font-mono text-center mt-1">
                                                Emitido por: {previewDocData?.metadata?.issuer_name || user?.fullName || 'Sistema'}
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
                    <>
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

                    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 mt-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Assinaturas Adicionais</h2>
                                <p className="text-sm text-slate-500">Cadastre assinaturas extras para selecionar ao emitir documentos específicos.</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddSignatureModal}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-lg shrink-0"
                            >
                                <Plus size={14} />
                                Adicionar Assinatura
                            </button>
                        </div>

                        {/* List of current additional signatures in a Table */}
                        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Assinatura</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nome</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Cargo</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(configData.signatures || []).map(sig => (
                                        <tr key={sig.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                {sig.url ? (
                                                    <img src={sig.url} alt="" className="h-8 w-14 object-contain bg-white border border-gray-200 rounded p-1" />
                                                ) : (
                                                    <div className="h-8 w-14 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-400">Sem Img</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-850 truncate max-w-[120px]">{sig.name}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[120px]">{sig.role}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditSignatureModal(sig)}
                                                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="Editar Assinatura"
                                                    >
                                                        <Settings size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSignature(sig.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remover Assinatura"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(configData.signatures || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-xs text-slate-400 italic text-center">
                                                Nenhuma assinatura adicional cadastrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </>
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

            {/* Add / Edit Signature Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-black text-slate-800">
                                {editingSignature ? 'Editar Assinatura' : 'Adicionar Assinatura'}
                            </h3>
                            <button 
                                onClick={() => setIsSignatureModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSignature} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Nome do Assinante</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Sec. Manuel Costa"
                                    value={sigFormName}
                                    onChange={(e) => setSigFormName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Cargo / Função</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Secretário Geral"
                                    value={sigFormRole}
                                    onChange={(e) => setSigFormRole(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Imagem da Assinatura</label>
                                <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-3 bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
                                    {sigFormPreviewUrl ? (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <img src={sigFormPreviewUrl} alt="Preview" className="h-12 object-contain" />
                                            <p className="text-[10px] text-green-600 font-bold">Assinatura carregada</p>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 space-y-1">
                                            <Upload className="mx-auto text-slate-300" size={24} />
                                            <p className="text-[10px] font-bold">Faça upload da imagem</p>
                                        </div>
                                    )}

                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleSigFormFileChange}
                                        disabled={uploadingSigForm}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    {uploadingSigForm && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                                            <Loader2 className="animate-spin text-orange-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploadingSigForm}
                                className="w-full py-3 bg-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 disabled:opacity-80"
                            >
                                {uploadingSigForm ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Salvar Assinatura
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
