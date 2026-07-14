import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../../data/angolaLocations';
import { formatDateForInput } from '../../utils/dateUtils';
import { Camera, X, Plus, Trash2, User, Heart, Shield, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'> | Member) => void;
    member?: Member;
}

const RELATIONSHIP_TYPES = [
    { value: 'Irmão/Irmã', label: 'Irmão/Irmã' },
    { value: 'Primo(a)', label: 'Primo(a)' },
    { value: 'Avô/Avó', label: 'Avô/Avó' },
    { value: 'Tio(a)', label: 'Tio(a)' },
    { value: 'Sobrinho(a)', label: 'Sobrinho(a)' }
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EDUCATION_LEVELS = [
    { value: 'Sem', label: 'Sem Instrução' },
    { value: 'Base', label: 'Ensino Básico' },
    { value: 'Medio', label: 'Ensino Médio' },
    { value: 'Universidade', label: 'Universitário' },
    { value: 'Pós-universitário', label: 'Pós-universitário' }
];

const ECO_TITLES = ['Membro', 'Cooperador', 'Diácono', 'Presbítero', 'Pastor', 'Bispo', 'Apóstolo', 'Evangelista', 'Missionário', 'Mestre', 'Profeta', 'Ancião', 'Supervisor'];
const ECO_FUNCTIONS = ['Líder de Célula', 'Líder de Louvor', 'Professor da EBD', 'Sonoplasta', 'Secretário(a)', 'Tesoureiro(a)', 'Apoio Social', 'Protocolo', 'Líder de Jovens', 'Líder de Crianças'];

// Sub-component for member search dropdown or manual input
const MemberSearchInput: React.FC<{
    valueName: string;
    valueId?: string | null;
    placeholder: string;
    members: Member[];
    onChange: (name: string, id: string | null) => void;
}> = ({ valueName, valueId, placeholder, members, onChange }) => {
    const [query, setQuery] = useState(valueName || '');
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(valueName || '');
    }, [valueName]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = query.trim() ? members.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        (m.memberCode && m.memberCode.toLowerCase().includes(query.toLowerCase()))
    ) : [];

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    onChange(val, null); // defaults to manual custom text
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                placeholder={placeholder}
            />
            {showDropdown && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filtered.map(m => (
                        <button
                            type="button"
                            key={m.id}
                            onClick={() => {
                                onChange(m.name, m.id);
                                setQuery(m.name);
                                setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-orange-50 flex items-center justify-between text-sm border-b border-gray-100 last:border-0"
                        >
                            <span className="font-medium text-slate-800">{m.name}</span>
                            <span className="text-xs text-slate-400">{m.memberCode || ''}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'family' | 'relationships' | 'ecclesiastical' | 'transition'>('personal');
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    
    // Form fields
    const [formData, setFormData] = useState<Omit<Member, 'id' | 'avatar'>>({
        name: '',
        email: '',
        phone: '',
        biNumber: '',
        status: 'Active',
        gender: undefined,
        maritalStatus: undefined,
        birthDate: '',
        churchRole: '',
        isBaptized: false,
        baptismDate: '',
        address: '',
        neighborhood: '',
        district: '',
        province: '',
        country: 'Angola',
        municipality: '',
        occupation: '',
        notes: '',
        joinDate: '',
        nickname: '',
        bloodType: '',
        emergencyContact: '',
        spouseMemberId: null,
        spouseName: '',
        marriageDate: '',
        fatherMemberId: null,
        fatherName: '',
        motherMemberId: null,
        motherName: '',
        childrenData: [],
        customRelationships: [],
        conversionDate: '',
        conversionChurch: '',
        baptismChurch: '',
        entryDate: '',
        entryReason: 'Conversão',
        entryOriginChurch: '',
        exitDate: '',
        exitReason: '',
        exitDestinationChurch: '',
        transitionHistory: [],
        ecclesiasticalTitles: [],
        ecclesiasticalFunctions: []
    });

    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [churchRoles, setChurchRoles] = useState<string[]>([]);
    const [memberProvince, setMemberProvince] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // List of registered relationships (loaded and saved in member_relationships table)
    const [relationships, setRelationships] = useState<{
        id?: string;
        relatedMemberId: string;
        type: string;
        isNew?: boolean;
        isDeleted?: boolean;
    }[]>([]);

    useEffect(() => {
        const fetchAllMembers = async () => {
            if (user?.churchId) {
                const { data } = await supabase
                    .from('members')
                    .select('id, name, member_code, avatar_url')
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null)
                    .order('name', { ascending: true });
                if (data) {
                    setAllMembers(data.map(m => ({
                        id: m.id,
                        name: m.name,
                        memberCode: m.member_code,
                        avatar: m.avatar_url
                    } as Member)));
                }
            }
        };
        if (isOpen) {
            fetchAllMembers();
        }
    }, [isOpen, user?.churchId]);

    useEffect(() => {
        const fetchExistingRelationships = async () => {
            if (member?.id && isOpen) {
                const { data } = await supabase
                    .from('member_relationships')
                    .select('id, related_member_id, relationship_type')
                    .eq('member_id', member.id);
                if (data) {
                    setRelationships(data.map(r => ({
                        id: r.id,
                        relatedMemberId: r.related_member_id,
                        type: r.relationship_type,
                        isNew: false
                    })));
                }
            } else {
                setRelationships([]);
            }
        };
        fetchExistingRelationships();
    }, [member, isOpen]);

    useEffect(() => {
        const storedChurchRoles = JSON.parse(localStorage.getItem('thronus_church_roles') || '[]');
        setChurchRoles(storedChurchRoles);

        if (member) {
            setFormData({
                name: member.name,
                email: member.email,
                phone: member.phone,
                status: member.status,
                biNumber: member.biNumber || '',
                gender: member.gender,
                maritalStatus: member.maritalStatus,
                birthDate: formatDateForInput(member.birthDate),
                churchRole: member.churchRole || '',
                isBaptized: member.isBaptized || false,
                baptismDate: formatDateForInput(member.baptismDate),
                address: member.address || '',
                neighborhood: member.neighborhood || '',
                district: member.district || '',
                province: member.province || '',
                country: member.country || 'Angola',
                municipality: member.municipality || '',
                occupation: member.occupation || '',
                notes: member.notes || '',
                joinDate: formatDateForInput(member.joinDate) || '',
                nickname: member.nickname || '',
                bloodType: member.bloodType || '',
                emergencyContact: member.emergencyContact || '',
                spouseMemberId: member.spouseMemberId || null,
                spouseName: member.spouseName || '',
                marriageDate: formatDateForInput(member.marriageDate) || '',
                fatherMemberId: member.fatherMemberId || null,
                fatherName: member.fatherName || '',
                motherMemberId: member.motherMemberId || null,
                motherName: member.motherName || '',
                childrenData: member.childrenData || [],
                customRelationships: member.customRelationships || [],
                conversionDate: formatDateForInput(member.conversionDate) || '',
                conversionChurch: member.conversionChurch || '',
                baptismChurch: member.baptismChurch || '',
                entryDate: formatDateForInput(member.entryDate) || '',
                entryReason: member.entryReason || 'Conversão',
                entryOriginChurch: member.entryOriginChurch || '',
                exitDate: formatDateForInput(member.exitDate) || '',
                exitReason: member.exitReason || '',
                exitDestinationChurch: member.exitDestinationChurch || '',
                transitionHistory: member.transitionHistory || [],
                ecclesiasticalTitles: member.ecclesiasticalTitles || [],
                ecclesiasticalFunctions: member.ecclesiasticalFunctions || []
            });
            setMemberProvince(member.province || '');
            setAvatarUrl(member.avatar || '');
            setAvatarFile(null);
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                biNumber: '',
                status: 'Active',
                gender: undefined,
                maritalStatus: undefined,
                birthDate: '',
                churchRole: '',
                isBaptized: false,
                baptismDate: '',
                address: '',
                neighborhood: '',
                district: '',
                province: '',
                country: 'Angola',
                municipality: '',
                occupation: '',
                notes: '',
                joinDate: '',
                nickname: '',
                bloodType: '',
                emergencyContact: '',
                spouseMemberId: null,
                spouseName: '',
                marriageDate: '',
                fatherMemberId: null,
                fatherName: '',
                motherMemberId: null,
                motherName: '',
                childrenData: [],
                customRelationships: [],
                conversionDate: '',
                conversionChurch: '',
                baptismChurch: '',
                entryDate: '',
                entryReason: 'Conversão',
                entryOriginChurch: '',
                exitDate: '',
                exitReason: '',
                exitDestinationChurch: '',
                transitionHistory: [],
                ecclesiasticalTitles: [],
                ecclesiasticalFunctions: []
            });
            setMemberProvince('');
            setAvatarUrl('');
            setAvatarFile(null);
        }
        setActiveTab('personal');
    }, [member, isOpen]);

    if (!isOpen) return null;

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.warning('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.warning('A imagem deve ter no máximo 5MB.');
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setAvatarFile(null);
        setAvatarUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getDefaultAvatar = () => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Novo Membro')}&background=f97316&color=fff&size=200`;
    };

    const handleProvinceChange = (newProvince: string) => {
        setMemberProvince(newProvince);
        setFormData({ ...formData, province: newProvince, municipality: '' });
    };

    const getOppositeRelationship = (type: string, gender?: 'Male' | 'Female') => {
        const t = type.toLowerCase();
        if (t === 'pai' || t === 'mãe') {
            return 'Filho(a)';
        }
        if (t === 'filho(a)') {
            return gender === 'Female' ? 'Mãe' : 'Pai';
        }
        if (t === 'cônjuge') {
            return 'Cônjuge';
        }
        if (t.includes('irmão')) {
            return 'Irmão/Irmã';
        }
        if (t.includes('avô') || t.includes('avó')) {
            return 'Neto(a)';
        }
        if (t.includes('neto')) {
            return gender === 'Female' ? 'Avó' : 'Avô';
        }
        if (t.includes('tio') || t.includes('tia')) {
            return 'Sobrinho(a)';
        }
        if (t.includes('sobrinho')) {
            return gender === 'Female' ? 'Tia' : 'Tio';
        }
        return type;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const finalAvatar = avatarUrl || getDefaultAvatar();
            const finalMemberId = member?.id || crypto.randomUUID();

            // Save member
            await onSave({
                ...formData,
                id: finalMemberId,
                avatar: finalAvatar,
            });

            // 1. Sync Spouse Relationship (if selected)
            if (formData.spouseMemberId) {
                const spouseUpdate: any = {
                    spouse_member_id: finalMemberId,
                    spouse_name: formData.name,
                    marriage_date: formData.marriageDate || null
                };
                await supabase
                    .from('members')
                    .update(spouseUpdate)
                    .eq('id', formData.spouseMemberId);
            } else if (member?.spouseMemberId && !formData.spouseMemberId) {
                // If spouse was cleared, clear on the old spouse
                await supabase
                    .from('members')
                    .update({ spouse_member_id: null, spouse_name: null, marriage_date: null })
                    .eq('id', member.spouseMemberId);
            }

            // 2. Sync Parent/Child Relationships
            // Remove parent references for this member from any old child rows first
            if (formData.gender === 'Female') {
                await supabase
                    .from('members')
                    .update({ mother_member_id: null, mother_name: null })
                    .eq('mother_member_id', finalMemberId);
            } else {
                await supabase
                    .from('members')
                    .update({ father_member_id: null, father_name: null })
                    .eq('father_member_id', finalMemberId);
            }

            // Set parent references on all currently listed children
            for (const child of (formData.childrenData || [])) {
                if (child.memberId) {
                    const childUpdate: any = {};
                    if (formData.gender === 'Female') {
                        childUpdate.mother_member_id = finalMemberId;
                        childUpdate.mother_name = formData.name;
                    } else {
                        childUpdate.father_member_id = finalMemberId;
                        childUpdate.father_name = formData.name;
                    }
                    await supabase
                        .from('members')
                        .update(childUpdate)
                        .eq('id', child.memberId);
                }
            }

            // If a registered Father was selected, add this member to their children_data list
            if (formData.fatherMemberId) {
                const { data: fatherData } = await supabase
                    .from('members')
                    .select('children_data')
                    .eq('id', formData.fatherMemberId)
                    .single();
                
                let fatherChildren = fatherData?.children_data || [];
                if (!Array.isArray(fatherChildren)) fatherChildren = [];
                
                if (!fatherChildren.some((c: any) => c.memberId === finalMemberId)) {
                    fatherChildren.push({ memberId: finalMemberId, name: formData.name });
                    await supabase
                        .from('members')
                        .update({ children_data: fatherChildren })
                        .eq('id', formData.fatherMemberId);
                }
            }

            // If a registered Mother was selected, add this member to their children_data list
            if (formData.motherMemberId) {
                const { data: motherData } = await supabase
                    .from('members')
                    .select('children_data')
                    .eq('id', formData.motherMemberId)
                    .single();
                
                let motherChildren = motherData?.children_data || [];
                if (!Array.isArray(motherChildren)) motherChildren = [];
                
                if (!motherChildren.some((c: any) => c.memberId === finalMemberId)) {
                    motherChildren.push({ memberId: finalMemberId, name: formData.name });
                    await supabase
                        .from('members')
                        .update({ children_data: motherChildren })
                        .eq('id', formData.motherMemberId);
                }
            }

            // Save/sync other relationships in member_relationships table
            for (const r of relationships) {
                if (r.isNew && !r.isDeleted) {
                    await supabase
                        .from('member_relationships')
                        .insert({
                            member_id: finalMemberId,
                            related_member_id: r.relatedMemberId,
                            relationship_type: r.type
                        });
                    
                    // Inverse cross-reference relationship
                    const opposite = getOppositeRelationship(r.type, formData.gender);
                    if (opposite) {
                        await supabase
                            .from('member_relationships')
                            .insert({
                                member_id: r.relatedMemberId,
                                related_member_id: finalMemberId,
                                relationship_type: opposite
                            }).select().maybeSingle();
                    }
                } else if (r.isDeleted && r.id) {
                    await supabase
                        .from('member_relationships')
                        .delete()
                        .eq('id', r.id);
                }
            }

            onClose();
        } catch (err) {
            console.error("Error saving member:", err);
            toast.error("Erro ao salvar membro");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Array manipulation helpers
    const handleAddChild = () => {
        setFormData(prev => ({
            ...prev,
            childrenData: [...(prev.childrenData || []), { memberId: null, name: '' }]
        }));
    };

    const handleRemoveChild = (index: number) => {
        setFormData(prev => {
            const list = [...(prev.childrenData || [])];
            list.splice(index, 1);
            return { ...prev, childrenData: list };
        });
    };

    const handleChildChange = (index: number, name: string, id: string | null) => {
        setFormData(prev => {
            const list = [...(prev.childrenData || [])];
            list[index] = { memberId: id, name };
            return { ...prev, childrenData: list };
        });
    };



    // Registered relationships helpers
    const handleAddRegisteredRelation = (relatedMemberId: string, type: string) => {
        if (relationships.some(r => r.relatedMemberId === relatedMemberId && !r.isDeleted)) {
            toast.warning('Este parente já está vinculado.');
            return;
        }
        setRelationships(prev => [...prev, { relatedMemberId, type, isNew: true }]);
    };

    const handleRemoveRegisteredRelation = (index: number) => {
        setRelationships(prev => {
            const list = [...prev];
            const item = list[index];
            if (item.isNew) {
                list.splice(index, 1);
            } else {
                list[index] = { ...item, isDeleted: true };
            }
            return list;
        });
    };

    const handleToggleTitle = (title: string) => {
        setFormData(prev => {
            const titles = [...(prev.ecclesiasticalTitles || [])];
            const idx = titles.indexOf(title);
            if (idx >= 0) {
                titles.splice(idx, 1);
            } else {
                titles.push(title);
            }
            return { ...prev, ecclesiasticalTitles: titles };
        });
    };

    const handleToggleFunction = (func: string) => {
        setFormData(prev => {
            const functions = [...(prev.ecclesiasticalFunctions || [])];
            const idx = functions.indexOf(func);
            if (idx >= 0) {
                functions.splice(idx, 1);
            } else {
                functions.push(func);
            }
            return { ...prev, ecclesiasticalFunctions: functions };
        });
    };

    const allRoles = Array.from(new Set([
        'Membro',
        'Líder de Célula',
        'Professor',
        'Supervisor',
        ...(formData.churchRole ? [formData.churchRole] : []),
        ...churchRoles
    ]));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={member ? 'Editar Membro' : 'Adicionar Novo Membro'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar and Basic Header */}
                <div className="flex flex-col md:flex-row gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100">
                            <img
                                src={avatarUrl || getDefaultAvatar()}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all"
                            title="Alterar foto"
                        >
                            <Camera size={14} />
                        </button>
                        {avatarUrl && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="absolute top-0 right-0 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                                title="Remover foto"
                            >
                                <X size={10} />
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </div>

                    <div className="flex-1 w-full text-center md:text-left space-y-2">
                        <h4 className="text-lg font-bold text-slate-800">{formData.name || 'Nome do Membro'}</h4>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                            >
                                <option value="Active">🟢 Ativo</option>
                                <option value="Inactive">🔴 Inativo</option>
                                <option value="Visitor">🟡 Visitante</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Horizontal Tab Navigation */}
                <div className="border-b border-gray-100 flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                    {(['personal', 'contact', 'family', 'relationships', 'ecclesiastical', 'transition'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 shrink-0 ${
                                activeTab === tab
                                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {tab === 'personal' && 'Dados Pessoais'}
                            {tab === 'contact' && 'Contactos'}
                            {tab === 'family' && 'Família'}
                            {tab === 'relationships' && 'Vínculos'}
                            {tab === 'ecclesiastical' && 'Eclesiástica'}
                            {tab === 'transition' && 'Transição'}
                        </button>
                    ))}
                </div>

                {/* Tab Contents */}
                <div className="min-h-[350px]">
                    {/* Tab: Personal Data */}
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                    placeholder="Nome completo do membro"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Apelido / Alcunha</label>
                                <input
                                    type="text"
                                    value={formData.nickname || ''}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                    placeholder="Como prefere ser chamado"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nº do Bilhete (BI)</label>
                                <input
                                    type="text"
                                    value={formData.biNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, biNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                    placeholder="000000000LA000"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    value={formData.birthDate || ''}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gênero</label>
                                <select
                                    value={formData.gender || ''}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Male">Masculino</option>
                                    <option value="Female">Feminino</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado Civil</label>
                                <select
                                    value={formData.maritalStatus || ''}
                                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Single">Solteiro(a)</option>
                                    <option value="Married">Casado(a)</option>
                                    <option value="Divorced">Divorciado(a)</option>
                                    <option value="Widowed">Viúvo(a)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Escolaridade</label>
                                <select
                                    value={formData.educationLevel || ''}
                                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    {EDUCATION_LEVELS.map(lvl => (
                                        <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo Sanguíneo</label>
                                <select
                                    value={formData.bloodType || ''}
                                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    {BLOOD_TYPES.map(bt => (
                                        <option key={bt} value={bt}>{bt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Tab: Contacts & Location */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telefone Principal</label>
                                    <input
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        placeholder="9xx xxx xxx"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contacto de Emergência</label>
                                    <input
                                        type="text"
                                        value={formData.emergencyContact || ''}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        placeholder="Nome e telefone da pessoa de contacto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Profissão / Ocupação</label>
                                    <input
                                        type="text"
                                        value={formData.occupation || ''}
                                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        placeholder="Profissão actual"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-4">
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Endereço Residencial</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Morada Residencial</label>
                                        <input
                                            type="text"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                            placeholder="Rua, Casa nº, ponto de referência"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bairro</label>
                                        <input
                                            type="text"
                                            value={formData.neighborhood || ''}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distrito/Comuna</label>
                                        <input
                                            type="text"
                                            value={formData.district || ''}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Província</label>
                                        <select
                                            value={memberProvince}
                                            onChange={(e) => handleProvinceChange(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        >
                                            <option value="">Selecione...</option>
                                            {ANGOLA_PROVINCES.map(prov => (
                                                <option key={prov.id} value={prov.id}>{prov.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Município</label>
                                        <select
                                            value={formData.municipality || ''}
                                            onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                            disabled={!memberProvince}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm disabled:opacity-50"
                                        >
                                            <option value="">Selecione...</option>
                                            {memberProvince && ANGOLA_MUNICIPALITIES
                                                .filter(mun => mun.provinceId === memberProvince)
                                                .map(mun => (
                                                    <option key={mun.id} value={mun.id}>{mun.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Family */}
                    {activeTab === 'family' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Spouse Info */}
                            {formData.maritalStatus === 'Married' && (
                                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-4">
                                    <h5 className="text-xs font-bold text-orange-800 uppercase tracking-widest flex items-center gap-2">
                                        <Heart size={14} /> Dados do Cônjuge
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-1">Nome do Cônjuge</label>
                                            <MemberSearchInput
                                                valueName={formData.spouseName || ''}
                                                valueId={formData.spouseMemberId}
                                                placeholder="Busque ou digite o nome..."
                                                members={allMembers}
                                                onChange={(name, id) => setFormData({ ...formData, spouseName: name, spouseMemberId: id })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-1">Data do Casamento</label>
                                            <input
                                                type="date"
                                                value={formData.marriageDate || ''}
                                                onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Parents Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome do Pai</label>
                                    <MemberSearchInput
                                        valueName={formData.fatherName || ''}
                                        valueId={formData.fatherMemberId}
                                        placeholder="Busque ou escreva o nome do pai..."
                                        members={allMembers}
                                        onChange={(name, id) => setFormData({ ...formData, fatherName: name, fatherMemberId: id })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome da Mãe</label>
                                    <MemberSearchInput
                                        valueName={formData.motherName || ''}
                                        valueId={formData.motherMemberId}
                                        placeholder="Busque ou escreva o nome da mãe..."
                                        members={allMembers}
                                        onChange={(name, id) => setFormData({ ...formData, motherName: name, motherMemberId: id })}
                                    />
                                </div>
                            </div>

                            {/* Children Info */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Filhos</h5>
                                    <button
                                        type="button"
                                        onClick={handleAddChild}
                                        className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={14} /> Adicionar Filho
                                    </button>
                                </div>

                                {(formData.childrenData || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(formData.childrenData || []).map((child, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="flex-1">
                                                    <MemberSearchInput
                                                        valueName={child.name}
                                                        valueId={child.memberId}
                                                        placeholder="Pesquise o filho ou escreva o nome..."
                                                        members={allMembers}
                                                        onChange={(name, id) => handleChildChange(idx, name, id)}
                                                    />
                                                </div>
                                                {child.memberId && (() => {
                                                    const childM = allMembers.find(m => m.id === child.memberId);
                                                    if (childM?.birthDate) {
                                                        const birth = new Date(childM.birthDate);
                                                        const today = new Date();
                                                        let age = today.getFullYear() - birth.getFullYear();
                                                        const m = today.getMonth() - birth.getMonth();
                                                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                                                            age--;
                                                        }
                                                        return (
                                                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 text-xs font-semibold rounded-lg whitespace-nowrap">
                                                                {age} anos
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveChild(idx)}
                                                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic text-center py-4">Sem filhos cadastrados.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Vínculos */}
                    {activeTab === 'relationships' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Registered Relations Manager */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Vínculos de Membros da Igreja</h5>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Estes vínculos atualizam as duas fichas cruzadamente no sistema.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleAddRegisteredRelation('', 'Irmão/Irmã')}
                                            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={14} /> Novo Vínculo
                                        </button>
                                    </div>
                                </div>

                                {relationships.filter(r => !r.isDeleted).length > 0 ? (
                                    <div className="space-y-3">
                                        {relationships.map((rel, idx) => {
                                            if (rel.isDeleted) return null;
                                            return (
                                                <div key={idx} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl items-center">
                                                    <div className="flex-1 w-full">
                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Membro Parente</label>
                                                        <MemberSearchInput
                                                            valueName={allMembers.find(m => m.id === rel.relatedMemberId)?.name || ''}
                                                            valueId={rel.relatedMemberId}
                                                            placeholder="Pesquise o membro..."
                                                            members={allMembers}
                                                            onChange={(name, id) => {
                                                                if (id) {
                                                                    setRelationships(prev => {
                                                                        const copy = [...prev];
                                                                        copy[idx].relatedMemberId = id;
                                                                        return copy;
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-44">
                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Parentesco</label>
                                                        <select
                                                            value={rel.type}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setRelationships(prev => {
                                                                    const copy = [...prev];
                                                                    copy[idx].type = val;
                                                                    return copy;
                                                                });
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                                        >
                                                            {RELATIONSHIP_TYPES.map(t => (
                                                                <option key={t.value} value={t.value}>{t.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRegisteredRelation(idx)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end md:self-auto"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic text-center py-2">Sem vínculos cadastrados.</p>
                                )}
                            </div>


                        </div>
                    )}

                    {/* Tab: Ecclesiastical Life */}
                    {activeTab === 'ecclesiastical' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cargo / Função Principal</label>
                                    <select
                                        value={formData.churchRole || ''}
                                        onChange={(e) => setFormData({ ...formData, churchRole: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm font-medium"
                                    >
                                        <option value="">Selecione...</option>
                                        {allRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Admissão na Igreja</label>
                                    <input
                                        type="date"
                                        value={formData.joinDate || ''}
                                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Conversion & Baptism */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Conversão e Batismo</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data da Conversão</label>
                                        <input
                                            type="date"
                                            value={formData.conversionDate || ''}
                                            onChange={(e) => setFormData({ ...formData, conversionDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Igreja da Conversão</label>
                                        <input
                                            type="text"
                                            value={formData.conversionChurch || ''}
                                            onChange={(e) => setFormData({ ...formData, conversionChurch: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                            placeholder="Nome da igreja..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Batizado nas Águas?</label>
                                        <select
                                            value={formData.isBaptized ? 'yes' : 'no'}
                                            onChange={(e) => setFormData({ ...formData, isBaptized: e.target.value === 'yes' })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm font-medium"
                                        >
                                            <option value="no">Não</option>
                                            <option value="yes">Sim</option>
                                        </select>
                                    </div>
                                    {formData.isBaptized && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data do Batismo</label>
                                                <input
                                                    type="date"
                                                    value={formData.baptismDate || ''}
                                                    onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Local / Igreja do Batismo nas águas</label>
                                                <input
                                                    type="text"
                                                    value={formData.baptismChurch || ''}
                                                    onChange={(e) => setFormData({ ...formData, baptismChurch: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                                    placeholder="Templo, Rio, Chácara..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Titles and Functions */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Shield size={12} /> Títulos Eclesiásticos (Selecione vários)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ECO_TITLES.map(title => {
                                            const active = (formData.ecclesiasticalTitles || []).includes(title);
                                            return (
                                                <button
                                                    type="button"
                                                    key={title}
                                                    onClick={() => handleToggleTitle(title)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                        active
                                                            ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                                            : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <User size={12} /> Funções e Ministérios (Selecione várias)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ECO_FUNCTIONS.map(func => {
                                            const active = (formData.ecclesiasticalFunctions || []).includes(func);
                                            return (
                                                <button
                                                    type="button"
                                                    key={func}
                                                    onClick={() => handleToggleFunction(func)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                        active
                                                            ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                                                            : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {func}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Transition */}
                    {activeTab === 'transition' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Entrance */}
                            <div className="p-4 bg-green-50/30 border border-green-100 rounded-xl space-y-4">
                                <h5 className="text-xs font-bold text-green-800 uppercase tracking-widest">Registo de Entrada / Admissão</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Motivo da Entrada</label>
                                        <select
                                            value={formData.entryReason || ''}
                                            onChange={(e) => setFormData({ ...formData, entryReason: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium"
                                        >
                                            <option value="Conversão">Adesão por Conversão</option>
                                            <option value="Transferência">Adesão por Transferência</option>
                                            <option value="Aclamação">Adesão por Aclamação</option>
                                            <option value="Reconciliação">Reconciliação</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Data da Entrada</label>
                                        <input
                                            type="date"
                                            value={formData.entryDate || ''}
                                            onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Igreja de Origem</label>
                                        <input
                                            type="text"
                                            value={formData.entryOriginChurch || ''}
                                            onChange={(e) => setFormData({ ...formData, entryOriginChurch: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                            placeholder="Se veio transferido, digite o nome da igreja..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Exit */}
                            <div className="p-4 bg-red-50/30 border border-red-100 rounded-xl space-y-4">
                                <h5 className="text-xs font-bold text-red-800 uppercase tracking-widest">Registo de Saída / Desligamento</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Motivo da Saída</label>
                                        <select
                                            value={formData.exitReason || ''}
                                            onChange={(e) => setFormData({ ...formData, exitReason: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-medium"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="A pedido">A pedido do próprio</option>
                                            <option value="Abandono">Abandono</option>
                                            <option value="Desligamento">Desligamento disciplinar</option>
                                            <option value="Exclusão">Exclusão formal</option>
                                            <option value="Falecimento">Falecimento</option>
                                            <option value="Transferência">Transferência para outra igreja</option>
                                            <option value="Motivo Pessoal">Motivos Pessoais</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Data da Saída</label>
                                        <input
                                            type="date"
                                            value={formData.exitDate || ''}
                                            onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Igreja de Destino</label>
                                        <input
                                            type="text"
                                            value={formData.exitDestinationChurch || ''}
                                            onChange={(e) => setFormData({ ...formData, exitDestinationChurch: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                            placeholder="Nome da igreja de destino..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Transitions History */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Histórico de Transições</h5>
                                {(formData.transitionHistory || []).length > 0 ? (
                                    <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 text-xs">
                                        {(formData.transitionHistory || []).map((t: any, idx) => (
                                            <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-all">
                                                <div>
                                                    <span className="font-semibold text-slate-700 capitalize">{t.type}</span>
                                                    <span className="text-slate-400 mx-2">•</span>
                                                    <span className="text-slate-500">{t.reason}</span>
                                                    {t.church && <span className="text-slate-400 block mt-0.5">{t.church}</span>}
                                                </div>
                                                <span className="text-slate-400 font-medium">{t.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
                                        Nenhuma transição registada.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 hover:bg-gray-100 rounded-xl font-semibold transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? 'Salvando...' : (member ? 'Salvar Alterações' : 'Criar Membro')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MemberModal;
