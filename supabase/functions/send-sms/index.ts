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

    // Retrieve church_id from the user (handling both schemas)
    const { data: userData } = await supabase.from('users').select('church_id').eq('id', user.id).single();
    const churchId = userData?.church_id;

    if (!churchId) throw new Error("Usuário não associado a uma igreja.");

    const { phones, message } = await req.json()
    if (!phones || !phones.length || !message) {
      throw new Error("Parâmetros inválidos. Forneça telefones e a mensagem.");
    }

    const messagesCount = phones.length;

    // Check Balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('church_sms_balances')
      .select('available_messages')
      .eq('church_id', churchId)
      .single();

    if (balanceError || !balanceData || balanceData.available_messages < messagesCount) {
      throw new Error("Saldo de SMS insuficiente. Por favor, recarregue a sua conta.");
    }

    // Call TelcoSMS API for each phone number
    // De acordo com a documentação v2, é enviado para 1 número em cada requisição.
    const telcoPromises = phones.map((phone: string) => {
        return fetch("https://www.telcosms.co.ao/api/v2/send_message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // A key vai no request body conforme a doc
            },
            body: JSON.stringify({
                message: {
                    api_key_app: TELCOSMS_API_KEY,
                    phone_number: phone,
                    message_body: message
                }
            })
        }).then(res => res.json());
    });

    const telcoResults = await Promise.all(telcoPromises);
    
    // Check if at least one was successful (API pode retornar sucesso mas alguns falharem)
    // Assumimos envio sincero aqui:
    // ideal seria contabilizar quantos efetivamente deram sucesso se a API do Telco devolver o status
    const failed = telcoResults.filter(r => r.error || r.status === 'error');
    if (failed.length === messagesCount) {
        throw new Error("Falha no provedor SMS: Todos os envios falharam.");
    }

    const deliveredCount = messagesCount - failed.length;

    // Deduct Balance
    await supabase.rpc('deduct_sms_balance', {
      p_church_id: churchId,
      p_amount: deliveredCount
    });

    // Log Transaction
    await supabase.from('sms_transactions').insert({
      church_id: churchId,
      type: 'debit',
      amount: -deliveredCount,
      description: `Envio de ${deliveredCount} SMS via TelcoSMS. Falharam: ${failed.length}`
    });

    return new Response(
      JSON.stringify({ success: true, delivered: deliveredCount, failed: failed.length, message: "SMS processados!" }),
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
}
