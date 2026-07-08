import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface IssuedDocument {
    id: string;
    church_id: string;
    member_id?: string;
    document_type: 'member_card' | 'recommendation' | 'baptism_cert' | 'presentation_cert' | 'course_cert';
    title: string;
    recipient_name: string;
    recipient_details: any;
    issued_by: string;
    issue_date: string;
    hash_code: string;
    metadata: any;
    created_at?: string;
}

export const useDocuments = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<IssuedDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        if (!user?.churchId) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('issued_documents')
                .select('*')
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const addDocument = async (doc: Omit<IssuedDocument, 'id' | 'church_id' | 'issued_by' | 'hash_code'>) => {
        if (!user?.churchId) return null;
        try {
            const hashCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            const { data, error } = await (supabase as any)
                .from('issued_documents')
                .insert({
                    ...doc,
                    church_id: user.churchId,
                    issued_by: user.id,
                    hash_code: hashCode
                })
                .select()
                .single();

            if (error) throw error;
            await fetchDocuments();
            return data as IssuedDocument;
        } catch (err: any) {
            console.error('Error creating document:', err);
            setError(err.message);
            return null;
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('issued_documents')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setDocuments(prev => prev.filter(d => d.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const getChurchSettings = async () => {
        if (!user?.churchId) return null;
        try {
            const { data, error } = await (supabase as any)
                .from('churches')
                .select('settings, logo_url')
                .eq('id', user.churchId)
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching church settings:', err);
            return null;
        }
    };

    const updateChurchSettings = async (settings: any) => {
        if (!user?.churchId) return false;
        try {
            const current = await getChurchSettings();
            const mergedSettings = { ...current?.settings, ...settings };
            const { error } = await (supabase as any)
                .from('churches')
                .update({ settings: mergedSettings })
                .eq('id', user.churchId);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Error updating church settings:', err);
            return false;
        }
    };

    const uploadSignature = async (file: File): Promise<string | null> => {
        if (!user?.churchId) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `signature_${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${user.churchId}/${fileName}`;

            const { error: uploadError } = await (supabase.storage as any)
                .from('event-covers')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = (supabase.storage as any)
                .from('event-covers')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading signature:', error);
            return null;
        }
    };

    return {
        documents,
        loading,
        error,
        fetchDocuments,
        addDocument,
        deleteDocument,
        getChurchSettings,
        updateChurchSettings,
        uploadSignature
    };
};
