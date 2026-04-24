import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PASTORINI_BASE_URL = 'https://zap.inoovaweb.com.br'

async function callPastoriniApi(endpoint: string, method: string, apiKey: string, body?: unknown) {
    const url = `${PASTORINI_BASE_URL}${endpoint}`
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
    }
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body)
    }
    const response = await fetch(url, options)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `API error: ${response.status}`)
    return data
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const pastoriniApiKey = Deno.env.get('PASTORINI_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    try {
        const { data: instances, error: instError } = await supabase.from('instances').select('id, pastorini_id, company_name, clinic_config, pastorini_status').eq('active', true).not('clinic_config', 'is', null)
        if (instError) throw instError
        let totalSent = 0
        for (const inst of instances) {
            const config = (inst.clinic_config as any)?.automation
            if (!config?.enabled || inst.pastorini_status !== 'CONNECTED' && inst.pastorini_status !== 'open') continue
            const leadTimeHours = config.lead_time_hours || 24
            const now = new Date()
            const targetTime = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000)
            const { data: appointments, error: aptError } = await supabase.from('appointments').select(`id, start_time, status, patient_name, doctor:doctors!appointments_doctor_id_fkey(name), patient:contacts!appointments_patient_id_fkey(name, phone)`).eq('instance_id', inst.id).eq('status', 'scheduled').is('reminder_sent_at', null).lte('start_time', targetTime.toISOString()).gte('start_time', now.toISOString())
            if (aptError) continue
            for (const apt of appointments) {
                try {
                    const pat = apt.patient as any
                    const doc = apt.doctor as any
                    if (!pat?.phone) continue
                    const patientName = (apt.patient_name || pat?.name || 'Paciente').trim()
                    const firstName = patientName.split(' ')[0]
                    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://inoovasaude.inoovaweb.com.br'
                    const confirmationUrl = `${frontendUrl}/confirmation/${apt.id}`
                    const aptDate = new Date(apt.start_time)
                    const isToday = aptDate.toDateString() === now.toDateString()
                    const dayLabel = isToday ? 'hoje' : 'amanh\u00e3'
                    const dayName = aptDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' })
                    const dateStrOnly = aptDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
                    const timeStrOnly = aptDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
                    const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1)
                    
                    // Mensagem profissional com link de fallback
                    const mainMessage = `Ol\u00e1, ${firstName}.\n\nPara sua comodidade, lembramos que sua consulta est\u00e1 agendada para ${dayLabel} na ${inst.company_name}.\n\nData: ${dayCapitalized}, ${dateStrOnly} \u00e0s ${timeStrOnly}\nProfissional: Dr(a). ${doc.name}\n\nPor favor, utilize o bot\u00e3o abaixo para confirmar sua presen\u00e7a ou reagendar.\n\nCaso o bot\u00e3o n\u00e3o esteja vis\u00edvel, utilize o link:\n${confirmationUrl}`
                    
                    const jid = `${pat.phone.replace(/\D/g, '')}@s.whatsapp.net`
                    
                    // Usar send-buttons em vez de carrossel por seguran\u00e7a
                    await callPastoriniApi(`/api/instances/${inst.pastorini_id}/send-buttons`, 'POST', pastoriniApiKey, {
                        jid,
                        text: mainMessage,
                        footer: inst.company_name,
                        buttons: [
                            {
                                type: 'cta_url',
                                displayText: 'Confirmar ou Reagendar',
                                url: confirmationUrl
                            }
                        ]
                    })
                    
                    await supabase.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', apt.id)
                    totalSent++
                } catch (e) { console.error(e) }
            }
        }
        return new Response(JSON.stringify({ success: true, totalSent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
