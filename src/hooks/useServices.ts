import { useState, useEffect } from 'react';
import { supabase, getCurrentUserChurchId } from '../lib/supabase';
import { Service } from '../types';

export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch services from Supabase
    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);

            const churchId = await getCurrentUserChurchId();
            if (!churchId) {
                setServices([]);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('services')
                .select(`
                    *,
                    service_type:service_type_id(id, name),
                    preacher_member:preacher_id(id, name, phone),
                    sub_preacher_member:substitute_preacher_id(id, name, phone),
                    leader_member:leader_id(id, name, phone),
                    sub_leader_member:substitute_leader_id(id, name, phone)
                `)
                .eq('church_id', churchId)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            // Map database format to app format
            const mappedServices: Service[] = ((data as any[]) || []).map((dbService: any) => ({
                id: dbService.id,
                churchId: dbService.church_id,
                serviceTypeId: dbService.service_type_id || '',
                typeName: dbService.service_type?.name || 'Culto',
                status: dbService.status,
                date: dbService.date,
                startTime: dbService.start_time,
                theme: dbService.theme || '',
                preacher: dbService.preacher_member?.name || dbService.preacher_name || '',
                preacherId: dbService.preacher_id,
                preacherMember: dbService.preacher_member,
                substitutePreacher: dbService.sub_preacher_member?.name || dbService.substitute_preacher_name || '',
                substitutePreacherId: dbService.substitute_preacher_id,
                substitutePreacherMember: dbService.sub_preacher_member,
                leader: dbService.leader_member?.name || dbService.leader_name || '',
                leaderId: dbService.leader_id,
                leaderMember: dbService.leader_member,
                substituteLeader: dbService.sub_leader_member?.name || dbService.substitute_leader_name || '',
                substituteLeaderId: dbService.substitute_leader_id,
                substituteLeaderMember: dbService.sub_leader_member,
                location: dbService.location || '',
                description: dbService.description || '',
                statistics: {
                    adults: {
                        men: dbService.stats_adults_men || 0,
                        women: dbService.stats_adults_women || 0
                    },
                    children: {
                        boys: dbService.stats_children_boys || 0,
                        girls: dbService.stats_children_girls || 0
                    },
                    visitors: {
                        men: dbService.stats_visitors_men || 0,
                        women: dbService.stats_visitors_women || 0
                    },
                    newConverts: {
                        men: dbService.stats_new_converts_men || 0,
                        women: dbService.stats_new_converts_women || 0,
                        children: dbService.stats_new_converts_children || 0
                    }
                }
            }));

            setServices(mappedServices);
        } catch (err: any) {
            console.error('Error fetching services:', JSON.stringify(err, null, 2));
            setError(err instanceof Error ? err.message : 'Failed to fetch services');
        } finally {
            setLoading(false);
        }
    };

    // Create a new service
    const createService = async (service: Omit<Service, 'id'>) => {
        try {
            const churchId = await getCurrentUserChurchId();
            if (!churchId) {
                throw new Error('No church ID found');
            }

            const dbService: any = {
                church_id: churchId,
                service_type_id: service.serviceTypeId,
                status: service.status,
                date: service.date,
                start_time: service.startTime,
                theme: service.theme || null,
                preacher_name: service.preacher || null,
                preacher_id: service.preacherId || null,
                substitute_preacher_name: service.substitutePreacher || null,
                substitute_preacher_id: service.substitutePreacherId || null,
                leader_name: service.leader || null,
                leader_id: service.leaderId || null,
                substitute_leader_name: service.substituteLeader || null,
                substitute_leader_id: service.substituteLeaderId || null,
                location: service.location || null,
                description: service.description || null,
                stats_adults_men: service.statistics?.adults.men || 0,
                stats_adults_women: service.statistics?.adults.women || 0,
                stats_children_boys: service.statistics?.children.boys || 0,
                stats_children_girls: service.statistics?.children.girls || 0,
                stats_visitors_men: service.statistics?.visitors.men || 0,
                stats_visitors_women: service.statistics?.visitors.women || 0,
                stats_new_converts_men: service.statistics?.newConverts?.men || 0,
                stats_new_converts_women: service.statistics?.newConverts?.women || 0,
                stats_new_converts_children: service.statistics?.newConverts?.children || 0
            };

            // First, insert without select
            const { error: insertError } = await supabase
                .from('services')
                .insert(dbService);

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }

            // Then fetch the most recent service with service type name in a single query
            const { data: fetchedData, error: fetchError } = await supabase
                .from('services')
                .select(`
                    *,
                    service_types!inner(name),
                    preacher_member:preacher_id(id, name, phone),
                    sub_preacher_member:substitute_preacher_id(id, name, phone),
                    leader_member:leader_id(id, name, phone),
                    sub_leader_member:substitute_leader_id(id, name, phone)
                `)
                .eq('church_id', churchId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (fetchError) {
                console.error('Fetch error:', fetchError);
                throw fetchError;
            }

            if (!fetchedData || (fetchedData as any[]).length === 0) {
                console.error('No data returned after insert');
                throw new Error('Failed to fetch created service.');
            }

            const insertedData = (fetchedData as any[])[0];

            const newService: Service = {
                id: insertedData.id,
                churchId: insertedData.church_id,
                serviceTypeId: insertedData.service_type_id || '',
                typeName: insertedData.service_types?.name || service.typeName,
                status: insertedData.status,
                date: insertedData.date,
                startTime: insertedData.start_time,
                theme: insertedData.theme || '',
                preacher: insertedData.preacher_member?.name || insertedData.preacher_name || '',
                preacherId: insertedData.preacher_id,
                preacherMember: insertedData.preacher_member,
                substitutePreacher: insertedData.sub_preacher_member?.name || insertedData.substitute_preacher_name || '',
                substitutePreacherId: insertedData.substitute_preacher_id,
                substitutePreacherMember: insertedData.sub_preacher_member,
                leader: insertedData.leader_member?.name || insertedData.leader_name || '',
                leaderId: insertedData.leader_id,
                leaderMember: insertedData.leader_member,
                substituteLeader: insertedData.sub_leader_member?.name || insertedData.substitute_leader_name || '',
                substituteLeaderId: insertedData.substitute_leader_id,
                substituteLeaderMember: insertedData.sub_leader_member,
                location: insertedData.location || '',
                description: insertedData.description || '',
                statistics: {
                    adults: {
                        men: insertedData.stats_adults_men || 0,
                        women: insertedData.stats_adults_women || 0
                    },
                    children: {
                        boys: insertedData.stats_children_boys || 0,
                        girls: insertedData.stats_children_girls || 0
                    },
                    visitors: {
                        men: insertedData.stats_visitors_men || 0,
                        women: insertedData.stats_visitors_women || 0
                    },
                    newConverts: {
                        men: insertedData.stats_new_converts_men || 0,
                        women: insertedData.stats_new_converts_women || 0,
                        children: insertedData.stats_new_converts_children || 0
                    }
                }
            };

            setServices((prev: Service[]) => [newService, ...prev]);
            return newService;
        } catch (err) {
            console.error('Error creating service:', err);
            throw err;
        }
    };

    // Update an existing service
    const updateService = async (id: string, service: Partial<Service>) => {
        try {
            const dbService: any = {};

            if (service.serviceTypeId) dbService.service_type_id = service.serviceTypeId;
            if (service.status) dbService.status = service.status;
            if (service.date) dbService.date = service.date;
            if (service.startTime) dbService.start_time = service.startTime;
            if (service.theme !== undefined) dbService.theme = service.theme || null;
            if (service.location !== undefined) dbService.location = service.location || null;
            if (service.description !== undefined) dbService.description = service.description || null;
            if (service.preacher !== undefined) dbService.preacher_name = service.preacher || null;
            if (service.preacherId !== undefined) dbService.preacher_id = service.preacherId || null;
            if (service.substitutePreacher !== undefined) dbService.substitute_preacher_name = service.substitutePreacher || null;
            if (service.substitutePreacherId !== undefined) dbService.substitute_preacher_id = service.substitutePreacherId || null;
            if (service.leader !== undefined) dbService.leader_name = service.leader || null;
            if (service.leaderId !== undefined) dbService.leader_id = service.leaderId || null;
            if (service.substituteLeader !== undefined) dbService.substitute_leader_name = service.substituteLeader || null;
            if (service.substituteLeaderId !== undefined) dbService.substitute_leader_id = service.substituteLeaderId || null;

            if (service.statistics) {
                dbService.stats_adults_men = service.statistics.adults.men || 0;
                dbService.stats_adults_women = service.statistics.adults.women || 0;
                dbService.stats_children_boys = service.statistics.children.boys || 0;
                dbService.stats_children_girls = service.statistics.children.girls || 0;
                dbService.stats_visitors_men = service.statistics.visitors.men || 0;
                dbService.stats_visitors_women = service.statistics.visitors.women || 0;
                dbService.stats_new_converts_men = service.statistics.newConverts?.men || 0;
                dbService.stats_new_converts_women = service.statistics.newConverts?.women || 0;
                dbService.stats_new_converts_children = service.statistics.newConverts?.children || 0;
            }

            // First, update without select
            const { error: updateError } = await supabase
                .from('services')
                .update(dbService)
                .eq('id', id);

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            // Then fetch the updated service with service type name in a single query
            const { data: fetchedData, error: fetchError } = await supabase
                .from('services')
                .select(`
                    *,
                    service_types!inner(name),
                    preacher_member:preacher_id(id, name, phone),
                    sub_preacher_member:substitute_preacher_id(id, name, phone),
                    leader_member:leader_id(id, name, phone),
                    sub_leader_member:substitute_leader_id(id, name, phone)
                `)
                .eq('id', id)
                .is('deleted_at', null);

            if (fetchError) {
                console.error('Fetch error:', fetchError);
                throw fetchError;
            }

            if (!fetchedData || (fetchedData as any[]).length === 0) {
                console.error('No data found for ID:', id);
                throw new Error('Failed to fetch updated service.');
            }

            const updatedData = (fetchedData as any[])[0];

            const updatedService: Service = {
                id: updatedData.id,
                churchId: updatedData.church_id,
                serviceTypeId: updatedData.service_type_id || '',
                typeName: updatedData.service_types?.name || service.typeName || 'Culto',
                status: updatedData.status,
                date: updatedData.date,
                startTime: updatedData.start_time,
                theme: updatedData.theme || '',
                preacher: updatedData.preacher_member?.name || updatedData.preacher_name || '',
                preacherId: updatedData.preacher_id,
                preacherMember: updatedData.preacher_member,
                substitutePreacher: updatedData.sub_preacher_member?.name || updatedData.substitute_preacher_name || '',
                substitutePreacherId: updatedData.substitute_preacher_id,
                substitutePreacherMember: updatedData.sub_preacher_member,
                leader: updatedData.leader_member?.name || updatedData.leader_name || '',
                leaderId: updatedData.leader_id,
                leaderMember: updatedData.leader_member,
                substituteLeader: updatedData.sub_leader_member?.name || updatedData.substitute_leader_name || '',
                substituteLeaderId: updatedData.substitute_leader_id,
                substituteLeaderMember: updatedData.sub_leader_member,
                location: updatedData.location || '',
                description: updatedData.description || '',
                statistics: {
                    adults: {
                        men: updatedData.stats_adults_men || 0,
                        women: updatedData.stats_adults_women || 0
                    },
                    children: {
                        boys: updatedData.stats_children_boys || 0,
                        girls: updatedData.stats_children_girls || 0
                    },
                    visitors: {
                        men: updatedData.stats_visitors_men || 0,
                        women: updatedData.stats_visitors_women || 0
                    },
                    newConverts: {
                        men: updatedData.stats_new_converts_men || 0,
                        women: updatedData.stats_new_converts_women || 0,
                        children: updatedData.stats_new_converts_children || 0
                    }
                }
            };

            setServices((prev: Service[]) => prev.map(s => s.id === id ? updatedService : s));
            return updatedService;
        } catch (err) {
            console.error('Error updating service:', err);
            throw err;
        }
    };

    // Delete a service (soft delete)
    const deleteService = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('services')
                .update({ deleted_at: new Date().toISOString() } as any)
                .eq('id', id);

            if (deleteError) throw deleteError;

            setServices((prev: Service[]) => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting service:', err);
            throw err;
        }
    };

    // Get a single service by ID
    const getService = async (id: string): Promise<Service | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('services')
                .select(`
                    *,
                    service_type:service_type_id(id, name),
                    preacher_member:preacher_id(id, name, phone),
                    sub_preacher_member:substitute_preacher_id(id, name, phone),
                    leader_member:leader_id(id, name, phone),
                    sub_leader_member:substitute_leader_id(id, name, phone)
                `)
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (fetchError) throw fetchError;

            const serviceData = data as any;

            return {
                id: serviceData.id,
                churchId: serviceData.church_id,
                serviceTypeId: serviceData.service_type_id || '',
                typeName: serviceData.service_type?.name || 'Culto',
                status: serviceData.status,
                date: serviceData.date,
                startTime: serviceData.start_time,
                theme: serviceData.theme || '',
                preacher: serviceData.preacher_member?.name || serviceData.preacher_name || '',
                preacherId: serviceData.preacher_id,
                preacherMember: serviceData.preacher_member,
                substitutePreacher: serviceData.sub_preacher_member?.name || serviceData.substitute_preacher_name || '',
                substitutePreacherId: serviceData.substitute_preacher_id,
                substitutePreacherMember: serviceData.sub_preacher_member,
                leader: serviceData.leader_member?.name || serviceData.leader_name || '',
                leaderId: serviceData.leader_id,
                leaderMember: serviceData.leader_member,
                substituteLeader: serviceData.sub_leader_member?.name || serviceData.substitute_leader_name || '',
                substituteLeaderId: serviceData.substitute_leader_id,
                substituteLeaderMember: serviceData.sub_leader_member,
                location: serviceData.location || '',
                description: serviceData.description || '',
                statistics: {
                    adults: {
                        men: serviceData.stats_adults_men || 0,
                        women: serviceData.stats_adults_women || 0
                    },
                    children: {
                        boys: serviceData.stats_children_boys || 0,
                        girls: serviceData.stats_children_girls || 0
                    },
                    visitors: {
                        men: serviceData.stats_visitors_men || 0,
                        women: serviceData.stats_visitors_women || 0
                    },
                    newConverts: {
                        men: serviceData.stats_new_converts_men || 0,
                        women: serviceData.stats_new_converts_women || 0,
                        children: serviceData.stats_new_converts_children || 0
                    }
                }
            };
        } catch (err) {
            console.error('Error fetching service:', err);
            return null;
        }
    };

    // Update service statistics
    const updateStatistics = async (id: string, statistics: Service['statistics']) => {
        try {
            const { error: updateError } = await supabase
                .from('services')
                .update({
                    stats_adults_men: statistics?.adults.men || 0,
                    stats_adults_women: statistics?.adults.women || 0,
                    stats_children_boys: statistics?.children.boys || 0,
                    stats_children_girls: statistics?.children.girls || 0,
                    stats_visitors_men: statistics?.visitors.men || 0,
                    stats_visitors_women: statistics?.visitors.women || 0,
                    stats_new_converts_men: statistics?.newConverts?.men || 0,
                    stats_new_converts_women: statistics?.newConverts?.women || 0,
                    stats_new_converts_children: statistics?.newConverts?.children || 0
                } as Record<string, any>)
                .eq('id', id);

            if (updateError) throw updateError;

            // Update local state
            setServices((prev: Service[]) => prev.map(s =>
                s.id === id ? { ...s, statistics } : s
            ));
        } catch (err) {
            console.error('Error updating statistics:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    return {
        services,
        loading,
        error,
        fetchServices,
        createService,
        updateService,
        deleteService,
        getService,
        updateStatistics
    };
}
