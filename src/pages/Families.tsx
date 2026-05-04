import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Loader2, User } from 'lucide-react';
import { useMembers } from '../hooks/useMembers';
import { supabase } from '../lib/supabase';
import { Member } from '../types';

interface FamilyGroup {
    id: string; // generated id
    name: string; // derived family name
    members: (Member & { groupRelation?: string })[];
}

const getOppositeRelationship = (type: string, currentMemberGender?: string) => {
    switch (type) {
        case 'Pai':
        case 'Mãe':
            return 'Filho(a)';
        case 'Filho(a)':
            return currentMemberGender === 'Male' ? 'Pai' : (currentMemberGender === 'Female' ? 'Mãe' : 'Pai/Mãe');
        case 'Avô/Avó':
            return 'Neto(a)';
        case 'Neto(a)':
            return 'Avô/Avó';
        case 'Tio(a)':
            return 'Sobrinho(a)';
        case 'Sobrinho(a)':
            return 'Tio(a)';
        case 'Cônjuge':
        case 'Irmão/Irmã':
        case 'Outro':
        default:
            return type;
    }
};

const Families: React.FC = () => {
    const { members, loading: membersLoading } = useMembers();
    const navigate = useNavigate();
    const [relationships, setRelationships] = useState<any[]>([]);
    const [loadingRelations, setLoadingRelations] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchRelations = async () => {
            try {
                const { data, error } = await supabase
                    .from('member_relationships')
                    .select('member_id, related_member_id, relationship_type');
                if (error) throw error;
                setRelationships(data || []);
            } catch (err) {
                console.warn('Erro ao carregar vínculos familiares ou tabela não existe:', err);
            } finally {
                setLoadingRelations(false);
            }
        };
        fetchRelations();
    }, []);

    const families = useMemo(() => {
        if (!members.length) return [];

        // Build adjacency list
        const graph: Record<string, { to: string, type: string }[]> = {};
        members.forEach(m => graph[m.id] = []);

        relationships.forEach(rel => {
            if (graph[rel.member_id] && graph[rel.related_member_id]) {
                const memberB = members.find(m => m.id === rel.related_member_id);
                
                // member_id adds related_member_id as relationship_type
                graph[rel.member_id].push({
                    to: rel.related_member_id,
                    type: rel.relationship_type
                });
                
                // Reverse connection
                graph[rel.related_member_id].push({
                    to: rel.member_id,
                    type: getOppositeRelationship(rel.relationship_type, memberB?.gender)
                });
            }
        });

        const visited = new Set<string>();
        const familyGroups: FamilyGroup[] = [];

        const getLastName = (fullName: string) => {
            const parts = fullName.trim().split(' ');
            return parts.length > 1 ? parts[parts.length - 1] : parts[0];
        };

        members.forEach(member => {
            if (!visited.has(member.id)) {
                // BFS to find all connected members
                const groupMembers: (Member & { groupRelation?: string })[] = [];
                const queue = [member.id];
                visited.add(member.id);
                
                const relationsMap: Record<string, string> = {};
                relationsMap[member.id] = 'Principal';

                while (queue.length > 0) {
                    const currentId = queue.shift()!;
                    const currentMember = members.find(m => m.id === currentId);
                    
                    if (currentMember) {
                        groupMembers.push({
                            ...currentMember,
                            groupRelation: relationsMap[currentId]
                        });
                    }

                    graph[currentId].forEach(edge => {
                        if (!visited.has(edge.to)) {
                            visited.add(edge.to);
                            relationsMap[edge.to] = edge.type;
                            queue.push(edge.to);
                        }
                    });
                }

                // Only consider it a "Family" if there's more than 1 member connected
                if (groupMembers.length > 1) {
                    // Determine family name (most common last name)
                    const lastNames: Record<string, number> = {};
                    let mostCommonLastName = '';
                    let maxCount = 0;

                    groupMembers.forEach(m => {
                        const ln = getLastName(m.name);
                        lastNames[ln] = (lastNames[ln] || 0) + 1;
                        if (lastNames[ln] > maxCount) {
                            maxCount = lastNames[ln];
                            mostCommonLastName = ln;
                        }
                    });

                    // Sort members: Pai/Mãe first
                    const priorityMap: Record<string, number> = {
                        'Pai': 1,
                        'Mãe': 1,
                        'Principal': 2,
                        'Cônjuge': 3,
                        'Filho(a)': 4,
                        'Irmão/Irmã': 5,
                        'Avô/Avó': 6,
                        'Neto(a)': 7,
                        'Tio(a)': 8,
                        'Sobrinho(a)': 9,
                        'Outro': 10
                    };

                    groupMembers.sort((a, b) => {
                        const pA = priorityMap[a.groupRelation || 'Outro'] || 99;
                        const pB = priorityMap[b.groupRelation || 'Outro'] || 99;
                        if (pA !== pB) return pA - pB;
                        return a.name.localeCompare(b.name);
                    });

                    familyGroups.push({
                        id: `fam-${groupMembers[0].id}`,
                        name: `Família ${mostCommonLastName}`,
                        members: groupMembers
                    });
                }
            }
        });

        // Sort families by name
        return familyGroups.sort((a, b) => a.name.localeCompare(b.name));
    }, [members, relationships]);

    const filteredFamilies = families.filter(fam => 
        fam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fam.members.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (membersLoading || loadingRelations) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Users className="text-orange-500" />
                        Famílias da Igreja
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Visualize e gerencie os grupos familiares formados pelos vínculos entre membros.
                    </p>
                </div>
                
                <div className="w-full md:w-72 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar família ou membro..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                    />
                </div>
            </div>

            {filteredFamilies.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFamilies.map(family => (
                        <div key={family.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Users size={20} className="text-orange-500" />
                                    {family.name}
                                </h2>
                                <span className="px-2.5 py-1 bg-white text-orange-600 rounded-full text-xs font-semibold shadow-sm border border-orange-200">
                                    {family.members.length} membros
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    {family.members.map(member => (
                                        <div 
                                            key={member.id} 
                                            onClick={() => navigate(`/members/${member.id}`)}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-200">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={18} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-500 truncate">{member.role}</span>
                                                    {member.groupRelation && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-medium">
                                                            {member.groupRelation}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma família encontrada</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                        Para ver famílias aqui, cadastre vínculos familiares nos perfis dos membros. 
                        Qualquer grupo de membros conectados por um vínculo aparecerá como uma família.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Families;
