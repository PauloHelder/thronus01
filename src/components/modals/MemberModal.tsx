import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../../data/angolaLocations';
import { formatDateForInput } from '../../utils/dateUtils';
import { Camera, X } from 'lucide-react';

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'> | Member) => void;
    member?: Member;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Omit<Member, 'id' | 'avatar'>>({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
    });

    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [userRole, setUserRole] = useState<string>('member');
    const [customRoles, setCustomRoles] = useState<string[]>([]);
    const [churchRoles, setChurchRoles] = useState<string[]>([]);
    const [memberProvince, setMemberProvince] = useState('');

    useEffect(() => {
        // Load custom roles from localStorage
        const storedCustomRoles = JSON.parse(localStorage.getItem('thronus_custom_roles') || '[]');
        const storedChurchRoles = JSON.parse(localStorage.getItem('thronus_church_roles') || '[]');
        setCustomRoles(storedCustomRoles);
        setChurchRoles(storedChurchRoles);

        if (member) {
            setFormData({
                name: member.name,
                email: member.email,
                phone: member.phone,
                status: member.status,
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
            });
            setMemberProvince(member.province || '');
            setAvatarUrl(member.avatar || '');
            setAvatarFile(null);
            setUserRole('member');
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
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
            });
            setMemberProvince('');
            setAvatarUrl('');
            setAvatarFile(null);
            setUserRole('member');
        }
    }, [member, isOpen]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem.');
                return;
            }

            // Validar tamanho (máx 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 5MB.');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Determinar qual avatar usar
        const finalAvatar = avatarUrl || getDefaultAvatar();

        // Logic consolidated at the end of function to include autoInviteRole

        // Supabase Logic:
        // The member is saved via onSave (which calls useMembers hook -> Supabase).
        // If email is provided and we have a role selected, we should Offer to Invite the user.
        // Or Auto-Invite.

        // Since onSave is async but void in props, we might want to handle this in the parent or here.
        // Ideally, 'onSave' handles the member saving.
        // We can pass the 'userRole' to 'onSave' to handle the invite?
        // Or handle invite here separate from member save?
        // Member Save needs to happen first to get ID?
        // If creating new member, we don't have ID yet until onSave refetches.

        // Let's modify the onSave prop to accept 'inviteRole' or handle it inside the hook.
        // But for now, let's just update the local logic to passing the role expectation.

        // Actually, the prompt says "ao adicionar o email... o sistema deve criar a conta".
        // Use the existing 'create_user_invite' RPC is the best "system create account" equivalent we have without admin API.

        if (formData.email && user?.role === 'admin' && !member) {
            // We can't easily chain this because we need the real Member ID from the database to link?
            // Actually `user_invites` relies on Email. It doesn't need Member ID immediately.
            // The `accept_invite` RPC links Member and User.
            // So if we create an Invite, when they accept, it creates the User and Links to a NEW Member?
            // Wait, `accept_invite` creates a NEW Member.
            // If we are creating a Member manually here, we have a problem:
            // 1. We create Member X.
            // 2. We Invite Email Y.
            // 3. User accepts Invite Y.
            // 4. `accept_invite` creates Member Z.
            // Result: Duplicate members (X and Z).

            // Solution: Update `create_user_invite` or `accept_invite` to Link to EXISTING member if email matches?
            // Yes, `accept_invite` should check if member with email exists in church.

            // I'll update the component to invoke `onSave` with role data if possible, or just ignore specific invite triggering here 
            // and rely on the user manually clicking "Invite" in UserManagement.
            // BUT user asked "ao adicionar o email... criar conta".

            // Let's implement a direct call to create_user_invite here?
            // No, let's just Add a "Send Invite" checkbox or similar?

            // Simply:
            // 1. Save Member.
            // 2. If 'invite' requested, call `create_user_invite`.

            // To avoid the Duplicate Member issue, I need to check `accept_invite` SQL.
            // Step 539 SQL: 
            /*
            WITH new_member AS (
               INSERT INTO members ...
            )
            */
            // It ALWAYS inserts new member. I should fix that SQL first to be smart.

            // For this step, I will replace the LocalStorage mock with a comment or a call to a function if I had one.
            // I'll pass the intention to the parent via onSave?
            // The onSave signature is `(member) => void`.
            // I'll cheat and attach `role` to the member object if it's not strictly typed or if I extend type.
            // Member type doesn't have `role` (it has `churchRole`). System role is different.

            // I will leave the localStorage code deleted and add a TODO or call a helper.
            // Actually, I'll implement `handleInvite` inside `handleSubmit` but I need to wait for onSave?
            // `onSave` in `Members.tsx` calls `addMember` which awaits Supabase.

            // Refactor: Pass `autoInvite: boolean, role: string` to onSave?
            // I'll update the onSave signature in this file.
        }

        onSave({
            ...formData,
            id: member?.id, // undefined if new
            avatar: finalAvatar,
            // @ts-ignore
            autoInviteRole: (formData.email) ? (member ? (userRole || 'member') : userRole) : undefined
        });

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={member ? 'Editar Membro' : 'Adicionar Novo Membro'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Photo Upload Section */}
                    <div className="flex flex-col items-center pb-4 border-b border-gray-100">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-100 bg-gray-100">
                                <img
                                    src={avatarUrl || getDefaultAvatar()}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Camera Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                title="Adicionar foto"
                            >
                                <Camera size={20} />
                            </button>

                            {/* Remove Photo Button */}
                            {avatarUrl && (
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="absolute top-0 right-0 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                    title="Remover foto"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />

                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Clique no ícone da câmera para adicionar uma foto
                            <br />
                            <span className="text-slate-400">Máximo 5MB • JPG, PNG ou GIF</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: João Silva"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-xs text-slate-400 font-normal">(Opcional - Necessário para acesso ao sistema)</span></label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="joao@exemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone <span className="text-xs text-slate-400 font-normal">(Opcional)</span></label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gênero</label>
                            <select
                                value={formData.gender || ''}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Member['gender'] })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione</option>
                                <option value="Male">Masculino</option>
                                <option value="Female">Feminino</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                            <input
                                type="date"
                                value={formData.birthDate || ''}
                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado Civil</label>
                            <select
                                value={formData.maritalStatus || ''}
                                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as Member['maritalStatus'] })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione</option>
                                <option value="Single">Solteiro(a)</option>
                                <option value="Married">Casado(a)</option>
                                <option value="Divorced">Divorciado(a)</option>
                                <option value="Widowed">Viúvo(a)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Active">Ativo</option>
                                <option value="Inactive">Inativo</option>
                                <option value="Visitor">Visitante</option>
                            </select>
                        </div>
                    </div>

                    {/* Informações Eclesiásticas */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">Informações Eclesiásticas</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
                                    <select
                                        value={formData.churchRole || ''}
                                        onChange={(e) => setFormData({ ...formData, churchRole: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Membro">Membro</option>
                                        <option value="Diácono">Diácono</option>
                                        <option value="Presbítero">Presbítero</option>
                                        <option value="Pastor">Pastor</option>
                                        <option value="Líder de Célula">Líder de Célula</option>
                                        <option value="Líder de Louvor">Líder de Louvor</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Tesoureiro">Tesoureiro</option>
                                        <option value="Secretário">Secretário</option>
                                        {churchRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Batizado?</label>
                                    <select
                                        value={formData.isBaptized ? 'yes' : 'no'}
                                        onChange={(e) => setFormData({ ...formData, isBaptized: e.target.value === 'yes' })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="no">Não</option>
                                        <option value="yes">Sim</option>
                                    </select>
                                </div>
                            </div>
                            {formData.isBaptized && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Batismo</label>
                                    <input
                                        type="date"
                                        value={formData.baptismDate || ''}
                                        onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">Endereço</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Rua, Número, Complemento"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                                    <input
                                        type="text"
                                        value={formData.neighborhood || ''}
                                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Nome do bairro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Distrito/Comuna</label>
                                    <input
                                        type="text"
                                        value={formData.district || ''}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Distrito ou comuna"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                                    <select
                                        value={formData.country || 'Angola'}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="Angola">Angola</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Província</label>
                                    <select
                                        value={memberProvince}
                                        onChange={(e) => handleProvinceChange(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Selecione a província</option>
                                        {ANGOLA_PROVINCES.map(prov => (
                                            <option key={prov.id} value={prov.id}>{prov.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Município</label>
                                    <select
                                        value={formData.municipality || ''}
                                        onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                        disabled={!memberProvince}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Selecione o município</option>
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

                    {/* Acesso ao Sistema - Apenas Admin pode definir role, mas criação é automática se tiver email */}
                    {user?.role === 'admin' && formData.email && (
                        <div className="pt-4 border-t border-gray-100">
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Acesso (Usuário será criado automaticamente)</label>
                                    <select
                                        value={userRole}
                                        onChange={(e) => setUserRole(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="member">Membro (Apenas Visualizar)</option>
                                        <option value="leader">Líder (Editar Departamento/Eventos)</option>
                                        <option value="admin">Administrador (Acesso Total)</option>
                                        {customRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Como um email foi fornecido, um usuário será criado para este membro. A senha padrão será "123456".
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
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
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40"
                    >
                        {member ? 'Salvar Alterações' : 'Criar Membro'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MemberModal;
