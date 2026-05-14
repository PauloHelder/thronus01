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

    // 1. Get WhatsApp Config
    const { data: config } = await supabaseAdmin
      .from('church_whatsapp_config')
      .select('*')
      .eq('church_id', churchId)
      .eq('is_active', true)
      .single()

    if (!config) throw new Error("Integração WhatsApp não configurada ou inativa.")

    // 2. Call Evolution API
    // Format: POST {api_url}/message/sendText/{instance_name}
    // Headers: apikey: {api_key}
    // Body: { number: "...", text: "..." }
    
    // Ensure API URL doesn't end with slash
    const baseUrl = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url;
    const endpoint = `${baseUrl}/message/sendText/${config.instance_name}`

    const results = await Promise.all(
      phones.map(async (phone: string) => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "apikey": config.api_key
            },
            body: JSON.stringify({
               number: phone, 
               text: message 
            })
          })
          const json = await res.json()
          
          return { phone, success: res.ok, response: json }
        } catch (e: any) {
          return { phone, success: false, error: e.message }
        }
      })
    )

    const delivered = results.filter(r => r.success)
    
    // 3. Log results
    await supabaseAdmin.from('whatsapp_message_log').insert({
      church_id: churchId, 
      sent_by: user.id, 
      message: message, 
      phones: phones,
      context_type, 
      context_id, 
      status: delivered.length === phones.length ? 'sent' : delivered.length > 0 ? 'partial' : 'failed',
      response_data: results
    })

    return new Response(JSON.stringify({ 
      success: delivered.length > 0, 
      delivered_count: delivered.length, 
      failed_count: phones.length - delivered.length,
      results 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
