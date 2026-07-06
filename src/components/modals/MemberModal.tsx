import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../../data/angolaLocations';
import { formatDateForInput } from '../../utils/dateUtils';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'> | Member) => void;
    member?: Member;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const { user, hasRole } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    });

    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [churchRoles, setChurchRoles] = useState<string[]>([]);
    const [memberProvince, setMemberProvince] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Load custom roles from localStorage
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
            });
            setMemberProvince('');
            setAvatarUrl('');
            setAvatarFile(null);
        }
    }, [member, isOpen]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                toast.warning('Por favor, selecione apenas arquivos de imagem.');
                return;
            }

            // Validar tamanho (máx 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.warning('A imagem deve ter no máximo 5MB.');
                return;
            }

            setAvatarFile(file);

            // Criar preview
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Determinar qual avatar usar
            const finalAvatar = avatarUrl || getDefaultAvatar();

            await onSave({
                ...formData,
                id: member?.id, // undefined if new
                avatar: finalAvatar,
            });

            onClose();
        } catch (err) {
            console.error("Error saving member:", err);
            toast.error("Erro ao salvar membro");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={member ? 'Editar Membro' : 'Adicionar Novo Membro'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Coluna Esquerda: Foto e Dados Básicos */}
                    <div className="md:col-span-4 space-y-6">
                        {/* Photo Upload Section */}
                        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                                    <img
                                        src={avatarUrl || getDefaultAvatar()}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                    title="Adicionar foto"
                                >
                                    <Camera size={20} />
                                </button>

                                {avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="absolute top-1 right-1 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                        title="Remover foto"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />

                            <div className="text-center mt-4">
                                <p className="text-sm font-bold text-slate-700">Foto do Membro</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Máx 5MB • JPG, PNG</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status no Sistema</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                >
                                    <option value="Active">🟢 Ativo</option>
                                    <option value="Inactive">🔴 Inativo</option>
                                    <option value="Visitor">🟡 Visitante</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações Privadas</label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                                    placeholder="Notas internas sobre o membro..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Formulários Detalhados */}
                    <div className="md:col-span-8 space-y-8">
                        {/* Seção 1: Dados Pessoais */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Dados Pessoais</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="Nome completo do membro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº do Bilhete (BI)</label>
                                    <input
                                        type="text"
                                        value={formData.biNumber || ''}
                                        onChange={(e) => setFormData({ ...formData, biNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="000000000LA000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={formData.birthDate || ''}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gênero</label>
                                    <select
                                        value={formData.gender || ''}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        <option value="Male">Masculino</option>
                                        <option value="Female">Feminino</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Civil</label>
                                    <select
                                        value={formData.maritalStatus || ''}
                                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Single">Solteiro(a)</option>
                                        <option value="Married">Casado(a)</option>
                                        <option value="Divorced">Divorciado(a)</option>
                                        <option value="Widowed">Viúvo(a)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Seção 2: Contato e Profissão */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Contato e Profissão</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="9xx xxx xxx"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profissão</label>
                                    <input
                                        type="text"
                                        value={formData.occupation || ''}
                                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="Ex: Engenheiro, Professor, Estudante..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Seção 3: Informações Eclesiásticas */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Vida Eclesiástica</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo/Função</label>
                                    <select
                                        value={formData.churchRole || ''}
                                        onChange={(e) => setFormData({ ...formData, churchRole: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Membro">Membro</option>
                                        <option value="Diácono">Diácono</option>
                                        <option value="Presbítero">Presbítero</option>
                                        <option value="Pastor">Pastor</option>
                                        <option value="Líder de Célula">Líder de Célula</option>
                                        <option value="Professor">Professor</option>
                                        {churchRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Admissão</label>
                                    <input
                                        type="date"
                                        value={formData.joinDate || ''}
                                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batizado?</label>
                                    <select
                                        value={formData.isBaptized ? 'yes' : 'no'}
                                        onChange={(e) => setFormData({ ...formData, isBaptized: e.target.value === 'yes' })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    >
                                        <option value="no">Não</option>
                                        <option value="yes">Sim</option>
                                    </select>
                                </div>
                                {formData.isBaptized && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data do Batismo</label>
                                        <input
                                            type="date"
                                            value={formData.baptismDate || ''}
                                            onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Seção 4: Endereço */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <div className="w-1.5 h-4 bg-slate-500 rounded-full"></div>
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Localização</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço Residencial</label>
                                    <input
                                        type="text"
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        placeholder="Rua, Casa nº, etc"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bairro</label>
                                    <input
                                        type="text"
                                        value={formData.neighborhood || ''}
                                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Distrito/Comuna</label>
                                    <input
                                        type="text"
                                        value={formData.district || ''}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Província</label>
                                    <select
                                        value={memberProvince}
                                        onChange={(e) => handleProvinceChange(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    >
                                        <option value="">Selecione...</option>
                                        {ANGOLA_PROVINCES.map(prov => (
                                            <option key={prov.id} value={prov.id}>{prov.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Município</label>
                                    <select
                                        value={formData.municipality || ''}
                                        onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                        disabled={!memberProvince}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
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
                        </section>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Salvando...' : (member ? 'Salvar Alterações' : 'Criar Membro')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MemberModal;
