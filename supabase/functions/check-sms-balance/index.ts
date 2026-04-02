import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// TelcoSMS API credentials (should be set in Supabase Secrets)
const TELCOSMS_API_KEY = Deno.env.get("TELCOSMS_API_KEY");

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Não autorizado");

    // Retrieve user and check permissions explicitly using is_superuser RPC equivalent conceptually
    // However, the cleanest way is just verify if their session has superuser role or check via DB.
    // we can rely on `public.is_superuser()` to be 100% sure.
    const { data: isSuper, error: superErr } = await supabase.rpc('is_superuser');
    if (superErr || !isSuper) {
       throw new Error("Acesso Negado: Apenas Super Admins podem aceder ao saldo geral.");
    }

    // Call TelcoSMS API to check balance
    // GET https://www.telcosms.co.ao/api/v2/check_balance?api_key_app=...
    const url = `https://www.telcosms.co.ao/api/v2/check_balance?api_key_app=${TELCOSMS_API_KEY}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const telcoResult = await response.json();

    if (!response.ok) {
      throw new Error(`Falha ao ler gateway SMS: ${JSON.stringify(telcoResult)}`);
    }

    return new Response(
      JSON.stringify({ 
         success: true, 
         // Assuming response is something like: { "status": 200, "balance": 15000 }
         telco_data: telcoResult 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
