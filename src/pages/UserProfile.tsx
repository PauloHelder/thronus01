import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Building, Shield, Camera, Save, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences'>('personal');

    // Estado do formulário
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        gender: 'Masculino',
        role: '',
        churchName: '',
        department: '',
        joinDate: '',
        bio: '',
        notes: '',
        occupation: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        smsNotifications: false,
        eventReminders: true,
        weeklyReports: true,
        language: 'pt',
        theme: 'light'
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // 1. Get member_id from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('member_id, email, role')
                .eq('id', user!.id)
                .single();

            if (userError) throw userError;

            const userRecord = userData as any;

            if (userRecord?.member_id) {
                setMemberId(userRecord.member_id);

                // 2. Get member details
                const { data: memberData, error: memberError } = await supabase
                    .from('members')
                    .select('*')
                    .eq('id', userRecord.member_id)
                    .single();

                if (memberError) throw memberError;

                // Fetch Departments
                const { data: deptData } = await supabase
                    .from('department_members')
                    .select('department:departments(name)')
                    .eq('member_id', userRecord.member_id);

                const deptName = deptData ? deptData.map((d: any) => d.department?.name).join(', ') : '';

                if (memberData) {
                    setFormData({
                        fullName: memberData.name || '',
                        email: userRecord.email || '', // Email comes from users/auth usually
                        phone: memberData.phone || '',
                        address: memberData.address || '',
                        birthDate: memberData.birth_date || '',
                        gender: memberData.gender || 'Masculino',
                        role: user?.role || 'user',
                        churchName: user?.churchName || '',
                        department: deptName,
                        joinDate: memberData.join_date || '',
                        bio: memberData.notes || '', // Mapping notes to bio for now
                        notes: memberData.notes || '',
                        occupation: memberData.occupation || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!memberId) return;

        try {
            const updates = {
                name: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                birth_date: formData.birthDate || null,
                gender: formData.gender,
                join_date: formData.joinDate || null,
                notes: formData.bio,
                occupation: formData.occupation
                // email update is skipped for now as it requires auth update
            };

            const { error } = await supabase
                .from('members')
                .update(updates)
                .eq('id', memberId);

            if (error) throw error;

            setIsEditing(false);
            toast.success('Perfil atualizado com sucesso!');
            fetchProfile(); // Reload data
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil.');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchProfile(); // Reset to saved data
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('As senhas não coincidem!');
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            toast.success('Senha alterada com sucesso!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.error('Erro ao alterar senha: ' + error.message);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'superuser':
                return 'bg-purple-100 text-purple-700';
            case 'admin':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'superuser':
                return 'Super Administrador';
            case 'admin':
                return 'Administrador';
            default:
                return 'Usuário';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header com Cover e Avatar */}
            <div className="relative">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-orange-500 to-orange-600 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Profile Info */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-20 pb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-xl flex items-center justify-center text-4xl font-bold text-orange-600">
                                    {formData.fullName.charAt(0).toUpperCase()}
                                </div>
                                <button className="absolute bottom-2 right-2 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
                                    <Camera size={16} />
                                </button>
                            </div>

                            {/* Name and Role */}
                            <div className="flex-1 text-center sm:text-left sm:mb-4">
                                <h1 className="text-2xl font-bold text-slate-800">{formData.fullName}</h1>
                                <p className="text-slate-600">{formData.email}</p>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(formData.role)}`}>
                                        {getRoleLabel(formData.role)}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Ativo
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Edit2 size={18} />
                                    Editar Perfil
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <X size={18} />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Save size={18} />
                                        Salvar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'personal'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-gray-300'
                                }`}
                        >
                            Informações Pessoais
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'security'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-gray-300'
                                }`}
                        >
                            Segurança
                        </button>
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'preferences'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-gray-300'
                                }`}
                        >
                            Preferências
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="py-6 space-y-6">
                    {/* Personal Information Tab */}
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Dados Pessoais</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Nome Completo
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-800">
                                                    <User size={16} />
                                                    <span>{formData.fullName}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Email
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-800">
                                                    <Mail size={16} />
                                                    <span>{formData.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Telefone
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-800">
                                                    <Phone size={16} />
                                                    <span>{formData.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Data de Nascimento
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.birthDate}
                                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-800">
                                                    <Calendar size={16} />
                                                    <span>{new Date(formData.birthDate).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Gênero
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={formData.gender}
                                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                >
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Feminino">Feminino</option>
                                                </select>
                                            ) : (
                                                <p className="text-slate-800">{formData.gender}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Profissão
                                            </label>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <select
                                                        value={[
                                                            'Professor', 'Engenheiro', 'Médico', 'Advogado', 'Administrador',
                                                            'Contabilista', 'T.I', 'Enfermeiro', 'Arquiteto', 'Vendedor'
                                                        ].includes(formData.occupation) ? formData.occupation : 'Outra'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'Outra') {
                                                                setFormData({ ...formData, occupation: '' });
                                                            } else {
                                                                setFormData({ ...formData, occupation: val });
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        <option value="Professor">Professor</option>
                                                        <option value="Engenheiro">Engenheiro</option>
                                                        <option value="Médico">Médico</option>
                                                        <option value="Advogado">Advogado</option>
                                                        <option value="Administrador">Administrador</option>
                                                        <option value="Contabilista">Contabilista</option>
                                                        <option value="T.I">T.I</option>
                                                        <option value="Enfermeiro">Enfermeiro</option>
                                                        <option value="Arquiteto">Arquiteto</option>
                                                        <option value="Vendedor">Vendedor</option>
                                                        <option value="Outra">Outra</option>
                                                    </select>
                                                    {(![
                                                        'Professor', 'Engenheiro', 'Médico', 'Advogado', 'Administrador',
                                                        'Contabilista', 'T.I', 'Enfermeiro', 'Arquiteto', 'Vendedor', ''
                                                    ].includes(formData.occupation) || formData.occupation === '') && (
                                                            <input
                                                                type="text"
                                                                value={formData.occupation}
                                                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                                                placeholder="Digite sua profissão"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-2"
                                                            />
                                                        )}
                                                </div>
                                            ) : (
                                                <p className="text-slate-800">{formData.occupation}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Departamento
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <p className="text-slate-800">{formData.department}</p>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Endereço
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-800">
                                                    <MapPin size={16} />
                                                    <span>{formData.address}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Biografia
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            ) : (
                                                <p className="text-slate-800">{formData.bio}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Igreja</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Building size={16} className="text-orange-500" />
                                            <span className="font-medium">{formData.churchName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar size={14} />
                                            <span>Membro desde {new Date(formData.joinDate).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
                                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Estatísticas</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-700">Cultos Participados</span>
                                            <span className="font-bold text-orange-900">48</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-700">Eventos Atendidos</span>
                                            <span className="font-bold text-orange-900">12</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-700">Frequência</span>
                                            <span className="font-bold text-orange-900">92%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="max-w-2xl">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Alterar Senha</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Senha Atual
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Nova Senha
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Confirmar Nova Senha
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasswordChange}
                                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Alterar Senha
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="max-w-2xl space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Notificações</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">Notificações por Email</p>
                                            <p className="text-sm text-slate-600">Receber atualizações por email</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.emailNotifications}
                                                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">Notificações por SMS</p>
                                            <p className="text-sm text-slate-600">Receber mensagens de texto</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.smsNotifications}
                                                onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">Lembretes de Eventos</p>
                                            <p className="text-sm text-slate-600">Receber lembretes antes dos eventos</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.eventReminders}
                                                onChange={(e) => setPreferences({ ...preferences, eventReminders: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">Relatórios Semanais</p>
                                            <p className="text-sm text-slate-600">Receber resumo semanal de atividades</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.weeklyReports}
                                                onChange={(e) => setPreferences({ ...preferences, weeklyReports: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Aparência</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Idioma
                                        </label>
                                        <select
                                            value={preferences.language}
                                            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="pt">Português</option>
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Tema
                                        </label>
                                        <select
                                            value={preferences.theme}
                                            onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="light">Claro</option>
                                            <option value="dark">Escuro</option>
                                            <option value="auto">Automático</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
