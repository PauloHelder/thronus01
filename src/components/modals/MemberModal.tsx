import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../../data/angolaLocations';

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'> | Member) => void;
    member?: Member;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Omit<Member, 'id' | 'avatar'>>({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
    });

    const [createUser, setCreateUser] = useState(false);
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
                birthDate: member.birthDate || '',
                churchRole: member.churchRole || '',
                isBaptized: member.isBaptized || false,
                baptismDate: member.baptismDate || '',
                address: member.address || '',
                neighborhood: member.neighborhood || '',
                district: member.district || '',
                province: member.province || '',
                country: member.country || 'Angola',
                municipality: member.municipality || '',
            });
            setMemberProvince(member.province || '');
            // Reset user creation fields when editing
            setCreateUser(false);
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
            setCreateUser(false);
            setUserRole('member');
        }
    }, [member, isOpen]);

    const handleProvinceChange = (newProvince: string) => {
        setMemberProvince(newProvince);
        setFormData({ ...formData, province: newProvince, municipality: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Save member data
        onSave({
            ...formData,
            id: member?.id || crypto.randomUUID(),
            avatar: member?.avatar || `https://i.pravatar.cc/150?u=${formData.email}`,
        });

        // If create user is checked, create a user in localStorage (mock)
        if (createUser && formData.email) {
            const users = JSON.parse(localStorage.getItem('thronus_users') || '[]');
            const existingUser = users.find((u: any) => u.email === formData.email);

            if (!existingUser) {
                const newUser = {
                    id: crypto.randomUUID(),
                    email: formData.email,
                    password: '123', // Default password
                    fullName: formData.name,
                    churchName: 'Minha Igreja', // Should come from context in real app
                    role: userRole,
                    createdAt: new Date().toISOString()
                };
                users.push(newUser);
                localStorage.setItem('thronus_users', JSON.stringify(users));
                alert(`Usuário criado com sucesso! Email: ${formData.email}, Senha: 123`);
            } else {
                alert('Já existe um usuário com este email.');
            }
        }

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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="joao@exemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                            <input
                                type="tel"
                                required
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
                    {/* Acesso ao Sistema - Apenas Admin pode criar usuários */}
                    {user?.role === 'admin' && (
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-slate-800">Acesso ao Sistema</h4>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="createUser"
                                        checked={createUser}
                                        onChange={(e) => setCreateUser(e.target.checked)}
                                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <label htmlFor="createUser" className="text-sm text-slate-600 cursor-pointer">
                                        Criar usuário para este membro
                                    </label>
                                </div>
                            </div>

                            {createUser && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Acesso</label>
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
                                            O usuário poderá fazer login com o email cadastrado acima. A senha padrão será "123456" (deve ser alterada no primeiro acesso).
                                        </p>
                                    </div>
                                </div>
                            )}
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
