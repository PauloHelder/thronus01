import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ResourceUsage {
  members: number;
  groups: number;
  leaders: number;
  disciples: number;
  departments: number;
  classes: number;
  events: number;
}

export interface SubscriptionFeatures {
  canLinkToSupervision: boolean;
  canBeLinked: number | 'unlimited';
  customBranding: boolean;
  maxMembers: number | 'unlimited';
  maxGroups: number | 'unlimited';
  maxLeaders: number | 'unlimited';
  maxDisciples: number | 'unlimited';
  maxDepartments: number | 'unlimited';
  maxClasses: number | 'unlimited';
  maxEvents: number;
  smsBonus: number;
}

export interface SubscriptionData {
  plan: {
    id: string;
    name: string;
    features: SubscriptionFeatures;
    expires_at: string | null;
  };
  usage: ResourceUsage;
}

export function useSubscriptionUsage() {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user?.churchId) return;

    try {
      setLoading(true);
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_church_subscription_usage', {
        p_church_id: user.churchId
      });

      if (rpcError) throw rpcError;
      setData(rpcData as SubscriptionData);
    } catch (err: any) {
      console.error('Error fetching subscription usage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.churchId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { data, loading, error, refresh: fetchUsage };
}
