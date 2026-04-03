import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 2. Parse Webhook Data (Assuming JSON POST from TelcoSMS)
    const payload = await req.json()
    console.log('TelcoSMS Webhook Received:', JSON.stringify(payload))

    // TelcoSMS common fields: 'id' (external_id), 'status' (DELIVRD, undeliv, failed), 'phone'
    const { id: externalId, status, phone, error_code, done_date } = payload

    if (!externalId) {
      throw new Error("Webhook inválido: external_id ausente.")
    }

    // 3. Map Gateway Status to our internal status
    // Gateway statuses: DELIVRD -> delivered, undeliv -> undelivered, failed -> failed, expired -> expired
    const internalStatusMap: Record<string, string> = {
      'DELIVRD': 'delivered',
      'undeliv': 'undelivered',
      'failed': 'failed',
      'expired': 'expired',
      'rejected': 'failed'
    }

    const internalStatus = internalStatusMap[status] || status.toLowerCase()

    // 4. Update the delivery record
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('sms_deliveries')
      .update({
        status: internalStatus,
        error_message: error_code || null,
        delivered_at: done_date ? new Date(done_date).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('external_id', externalId)
      .select('history_id')
      .single()

    if (updateErr) {
      console.warn(`Mensagem ID: ${externalId} não encontrada ou erro ao atualizar:`, updateErr.message)
    } else if (updated) {
       console.log(`Mensagem ${externalId} atualizada para '${internalStatus}'`)
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook processado!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
