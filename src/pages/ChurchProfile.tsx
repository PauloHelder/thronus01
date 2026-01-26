import React, { useState, useEffect } from 'react';
import { Building, Mail, Phone, MapPin, Users, Calendar, Edit2, Save, X, Link2, Check, Copy, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MOCK_CHURCHES } from '../mocks/churches';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../data/angolaLocations';

const ChurchProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    const isReadOnly = !!id;

    // State for linking info
    const [parentInfo, setParentInfo] = useState<{ id: string; name: string; category: string } | null>(null);
    const [sharedPermissions, setSharedPermissions] = useState<any>({
        view_members: false,
        view_service_stats: false,
        view_discipleship: false,
        view_departments: false,
        view_teaching: false,
        view_events: false
    });

    const [formData, setFormData] = useState({
        churchName: 'Demo Church',
        sigla: 'DC',
        denominacao: 'Igreja Assembleia de Deus',
        nif: '123456789',
        endereco: 'Rua Principal, 123',
        provincia: '',
        municipio: '',
        bairro: 'Zango',
        distrito: '',
        pais: 'Angola',
        categoria: 'Sede',
        email: 'demo@church.com',
        telefone: '+244 900 000 000',
        nomePastor: 'Pastor Demo',
        codigoVinculacao: 'ABC123',
        foundedDate: '2020-01-15',
        memberCount: 1204,
        description: 'Uma igreja comprometida com a transformação de vidas através do evangelho de Jesus Cristo.'
    });
    const [churchProvince, setChurchProvince] = useState('');

    useEffect(() => {
        const fetchChurchData = async () => {
            const targetId = id || user?.churchId;
            if (!targetId) return;

            try {
                const { data: churchData, error } = await supabase
                    .from('churches')
                    .select('*')
                    .eq('id', targetId)
                    .single();

                if (error) throw error;

                const church = churchData as any;

                if (church) {
                    const settings = church.settings || {};
                    setFormData({
                        churchName: church.name,
                        sigla: settings.sigla || '',
                        denominacao: settings.denominacao || '',
                        nif: settings.nif || '',
                        endereco: settings.endereco || '',
                        provincia: settings.provincia || '',
                        municipio: settings.municipio || '',
                        bairro: settings.bairro || '',
                        distrito: settings.distrito || '',
                        pais: settings.pais || 'Angola',
                        categoria: settings.categoria || 'Sede',
                        email: settings.email || church.email || '',
                        telefone: settings.telefone || church.phone || '',
                        nomePastor: settings.nomePastor || '',
                        codigoVinculacao: church.slug || 'N/A',
                        foundedDate: church.created_at || new Date().toISOString().split('T')[0],
                        memberCount: settings.memberCount || 0,
                        description: settings.description || ''
                    });

                    // Set shared permissions if they exist
                    if (settings.shared_permissions) {
                        setSharedPermissions(settings.shared_permissions);
                    }

                    // Fetch parent church info if linked
                    if (church.parent_id) {
                        const { data: parentData } = await supabase
                            .from('churches')
                            .select('id, name, settings')
                            .eq('id', church.parent_id)
                            .single();

                        if (parentData) {
                            const pData = parentData as any;
                            setParentInfo({
                                id: pData.id,
                                name: pData.name,
                                category: pData.settings?.categoria || 'Sede'
                            });
                        }
                    }

                    if (settings.provincia) {
                        setChurchProvince(settings.provincia);
                    }
                }
            } catch (error) {
                console.error('Error fetching church data:', error);

                // If checking own profile, fallback to context
                if (!id && user) {
                    setFormData(prev => ({
                        ...prev,
                        churchName: user.churchName,
                        email: user.email,
                        telefone: user.phone || prev.telefone,
                        nomePastor: user.fullName
                    }));
                }
            }
        };

        fetchChurchData();
    }, [id, user]);

    const handleProvinceChange = (newProvince: string) => {
        setChurchProvince(newProvince);
        setFormData({ ...formData, provincia: newProvince, municipio: '' });
    };

    const handleSave = async () => {
        if (!user?.churchId) return;

        try {
            // Fetch current settings to preserve other keys
            const { data: currentData } = await supabase
                .from('churches')
                .select('settings')
                .eq('id', user.churchId)
                .single();

            const currentSettings = currentData?.settings || {};

            const updatedSettings = {
                ...currentSettings,
                sigla: formData.sigla,
                denominacao: formData.denominacao,
                nif: formData.nif,
                endereco: formData.endereco,
                provincia: formData.provincia,
                municipio: formData.municipio,
                bairro: formData.bairro,
                distrito: formData.distrito,
                pais: formData.pais,
                categoria: formData.categoria,
                email: formData.email,
                telefone: formData.telefone,
                nomePastor: formData.nomePastor,
                memberCount: formData.memberCount,
                description: formData.description
            };

            const { error } = await supabase
                .from('churches')
                .update({
                    name: formData.churchName,
                    settings: updatedSettings
                })
                .eq('id', user.churchId);

            if (error) throw error;

            toast.success('Perfil da igreja atualizado com sucesso!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating church profile:', error);
            toast.error('Erro ao atualizar perfil.');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Resetar formData para os valores originais
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Perfil da Igreja</h1>
                    <p className="text-slate-600">Gerencie as informações da sua igreja</p>
                </div>
                {!isEditing && !isReadOnly && user?.role === 'admin' ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 md:mt-0 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Edit2 size={20} />
                        Editar Perfil
                    </button>
                ) : isEditing ? (
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <X size={20} />
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <Save size={20} />
                            Salvar
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Church Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 mb-8 text-white">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <Building className="text-orange-500" size={48} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-2">{formData.churchName}</h2>
                        <p className="text-orange-100 mb-3">{formData.sigla} • {formData.categoria}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{formData.memberCount} membros</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>Fundada em {new Date(formData.foundedDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informações Básicas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Informações Básicas</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nome da Igreja
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.churchName}
                                        onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.churchName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Sigla
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.sigla}
                                        onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                                        maxLength={10}
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.sigla}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Denominação
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.denominacao}
                                        onChange={(e) => setFormData({ ...formData, denominacao: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.denominacao}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    NIF
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.nif}
                                        onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.nif}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Categoria
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="Sede">Sede</option>
                                        <option value="Ministério">Ministério</option>
                                        <option value="Centro">Centro</option>
                                        <option value="Congregação">Congregação</option>
                                        <option value="SubCongregação">SubCongregação</option>
                                        <option value="Ponto de Pregação">Ponto de Pregação</option>
                                        <option value="Ponto de oração">Ponto de oração</option>
                                        <option value="Grupo de oração">Grupo de oração</option>
                                    </select>
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.categoria}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Descrição
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                    />
                                ) : (
                                    <p className="text-slate-600">{formData.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Localização */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <MapPin className="text-orange-500" size={24} />
                            Localização
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Endereço
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.endereco}
                                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Rua, Número, Complemento"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.endereco}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Bairro
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.bairro}
                                        onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Nome do bairro"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.bairro}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Distrito/Comuna
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.distrito || ''}
                                        onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Distrito ou comuna"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.distrito || 'N/A'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    País
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.pais}
                                        onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="Angola">Angola</option>
                                    </select>
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.pais || 'Angola'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Província
                                </label>
                                {isEditing ? (
                                    <select
                                        value={churchProvince}
                                        onChange={(e) => handleProvinceChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione a província</option>
                                        {ANGOLA_PROVINCES.map(prov => (
                                            <option key={prov.id} value={prov.id}>{prov.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.provincia}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Município
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.municipio}
                                        onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                                        disabled={!churchProvince}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Selecione o município</option>
                                        {churchProvince && ANGOLA_MUNICIPALITIES
                                            .filter(mun => mun.provinceId === churchProvince)
                                            .map(mun => (
                                                <option key={mun.id} value={mun.id}>{mun.name}</option>
                                            ))}
                                    </select>
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.municipio}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Contacto */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Contacto</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Mail size={16} className="text-orange-500" />
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
                                    <p className="text-slate-800 font-medium">{formData.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Phone size={16} className="text-orange-500" />
                                    Telefone
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={formData.telefone}
                                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.telefone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Liderança */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Liderança</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Pastor Principal
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.nomePastor}
                                        onChange={(e) => setFormData({ ...formData, nomePastor: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-slate-800 font-medium">{formData.nomePastor}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vinculação e Permissões */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Link2 size={24} className="text-orange-500" />
                            Vinculação
                        </h3>

                        {parentInfo ? (
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <p className="text-sm text-blue-600 mb-1">Vinculado a</p>
                                    <p className="text-lg font-bold text-blue-900">{parentInfo.name}</p>
                                    <p className="text-xs text-blue-700 mt-1">{parentInfo.category}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-slate-800 mb-3">Dados Compartilhados</h4>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'view_members', label: 'Ver Membros' },
                                            { key: 'view_service_stats', label: 'Ver Estatísticas de Culto' },
                                            { key: 'view_discipleship', label: 'Ver Discipulados' },
                                            { key: 'view_departments', label: 'Ver Departamentos' },
                                            { key: 'view_teaching', label: 'Ver Ensino' },
                                            { key: 'view_events', label: 'Ver Eventos' }
                                        ].map(({ key, label }) => (
                                            <div key={key} className="flex items-center gap-2 text-sm">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${sharedPermissions[key] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {sharedPermissions[key] ? <Check size={10} /> : <X size={10} />}
                                                </div>
                                                <span className={sharedPermissions[key] ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                <p className="text-slate-500 mb-2">Esta igreja não está vinculada a nenhuma sede.</p>
                                <p className="text-xs text-slate-400">Use a opção "Vincular Igreja" na página "Minhas Igrejas" para iniciar um vínculo.</p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="font-bold text-slate-800 mb-2">Seu Código de Vinculação</h4>
                            <p className="text-sm text-slate-600 mb-3">Compartilhe este código para que outras igrejas se vinculem a você.</p>
                            <div className="bg-slate-100 rounded-lg p-3 text-center">
                                <code className="text-xl font-bold text-orange-600 tracking-wider font-mono select-all">
                                    {formData.codigoVinculacao}
                                </code>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <UserCheck size={18} className="text-green-500" />
                                Link de Cadastro de Membros
                            </h4>
                            <p className="text-sm text-slate-600 mb-3">Link para membros se cadastrarem sozinhos nesta igreja.</p>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-hidden">
                                    <p className="text-xs text-slate-500 truncate font-mono">
                                        {`${window.location.origin}/#/join/${formData.codigoVinculacao}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const link = `${window.location.origin}/#/join/${formData.codigoVinculacao}`;
                                        navigator.clipboard.writeText(link);
                                        toast.success('Link de cadastro copiado!');
                                    }}
                                    className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 rounded-lg transition-all"
                                    title="Copiar Link"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas Rápidas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Estatísticas</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Total de Membros</span>
                                <span className="text-2xl font-bold text-orange-600">{formData.memberCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Grupos Ativos</span>
                                <span className="text-2xl font-bold text-orange-600">12</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Eventos este Mês</span>
                                <span className="text-2xl font-bold text-orange-600">8</span>
                            </div>
                        </div>
                    </div>

                    {/* Plano de Assinatura */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Plano de Assinatura</h3>

                        {/* Current Plan */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Plano Atual</p>
                                    <p className="text-2xl font-bold text-blue-900">Free</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-blue-900">0 Kz</p>
                                    <p className="text-xs text-blue-700">por mês</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-blue-700">
                                <Calendar size={14} />
                                <span>Válido indefinidamente</span>
                            </div>
                        </div>

                        {/* Plan Features */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Membros</span>
                                <span className="font-medium text-slate-800">100 / 100</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Grupos</span>
                                <span className="font-medium text-slate-800">10 / 10</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Departamentos</span>
                                <span className="font-medium text-slate-800">5 / 5</span>
                            </div>
                        </div>

                        {/* Upgrade Button */}
                        <button
                            onClick={() => window.location.href = '/#/subscription'}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                        >
                            Fazer Upgrade do Plano
                        </button>

                        <p className="text-xs text-slate-500 text-center mt-3">
                            Desbloqueie mais recursos com os planos Profissional ou Premium
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChurchProfile;
