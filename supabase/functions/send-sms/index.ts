import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', ''))
    if (authError || !user) throw new Error("Não autorizado")

    const { phones, message, context_type, context_id } = await req.json()
    if (!phones || !phones.length || !message) throw new Error("Parâmetros inválidos.")

    const { data: userData } = await supabaseAdmin.from('users').select('church_id').eq('id', user.id).single()
    const churchId = userData?.church_id
    if (!churchId) throw new Error("Usuário não associado a uma igreja.")

    const messagesCount = phones.length

    // 1. Check Balance
    const { data: balanceData } = await supabaseAdmin.from('church_sms_balances').select('available_messages').eq('church_id', churchId).single()
    if (!balanceData || balanceData.available_messages < messagesCount) throw new Error("Saldo insuficiente.")

    // 2. Call TelcoSMS API
    const TELCOSMS_API_KEY = Deno.env.get("TELCOSMS_API_KEY")
    const results = await Promise.all(
      phones.map(async (phone: string) => {
        try {
          const res = await fetch("https://www.telcosms.co.ao/api/v2/send_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               message: { api_key_app: TELCOSMS_API_KEY, phone_number: phone, message_body: message }
            })
          })
          const json = await res.json()
          // No v2, 'data.id' contém o message_id para tracking posterior no webhook
          return { phone, success: json.status === 200 || json.status === 'success', external_id: json.data?.id, error: json.error }
        } catch (e) {
          return { phone, success: false, error: e.message }
        }
      })
    )

    const delivered = results.filter(r => r.success)
    if (delivered.length > 0) {
      // 3. Create Main History Batch
      const { data: history, error: historyErr } = await supabaseAdmin.from('sms_history').insert({
        church_id: churchId, sender_id: user.id, content: message, recipient_count: delivered.length,
        recipients: delivered.map(r => r.phone), context_type, context_id, status: 'sent'
      }).select().single()

      if (history) {
        // 4. Create Individual Delivery Records for Webhook tracking
        const deliveries = delivered.map(d => ({
          history_id: history.id,
          external_id: d.external_id,
          phone_number: d.phone,
          status: 'pending' // starts as pending until webhook confirms 'delivered'
        }))
        await supabaseAdmin.from('sms_deliveries').insert(deliveries)
      }

      // 5. Update Financials
      await supabaseAdmin.rpc('deduct_sms_balance', { p_church_id: churchId, p_amount: delivered.length })
      await supabaseAdmin.from('sms_transactions').insert({
        church_id: churchId, type: 'debit', amount: -delivered.length,
        description: `Envio de ${delivered.length} SMS. Contexto: ${context_type || 'Geral'}`
      })
    }

    return new Response(JSON.stringify({ success: delivered.length > 0, delivered_count: delivered.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
