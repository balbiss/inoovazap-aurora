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

    if (!response.ok) {
        throw new Error(data.message || `API error: ${response.status}`)
    }

    return data
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const pastoriniApiKey = Deno.env.get('PASTORINI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        console.log('Starting scheduled reminders check...')

        // 1. Get all active instances with automation enabled
        const { data: instances, error: instError } = await supabase
            .from('instances')
            .select('id, pastorini_id, company_name, clinic_config, pastorini_status')
            .eq('active', true)
            .not('clinic_config', 'is', null)

        if (instError) throw instError

        let totalSent = 0

        for (const inst of instances) {
            const config = (inst.clinic_config as any)?.automation
            if (!config?.enabled || inst.pastorini_status !== 'CONNECTED' && inst.pastorini_status !== 'open') {
                continue
            }

            const leadTimeHours = config.lead_time_hours || 24

            // Calculate the window for reminders
            // We want appointments that are exactly leadTimeHours away (approx)
            // For simplicity, we search for all between (leadTimeHours - 1) and leadTimeHours
            // Or just anything where start_time <= now + leadTimeHours AND reminder_sent_at IS NULL

            const now = new Date()
            const targetTime = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000)

            console.log(`Checking instance ${inst.company_name} for appointments before ${targetTime.toISOString()}`)

            const { data: appointments, error: aptError } = await supabase
                .from('appointments')
                .select(`
          id,
          start_time,
          status,
          doctor:doctors!appointments_doctor_id_fkey(name),
          patient:contacts!appointments_patient_id_fkey(name, phone)
        `)
                .eq('instance_id', inst.id)
                .eq('status', 'scheduled')
                .is('reminder_sent_at', null)
                .lte('start_time', targetTime.toISOString())
                .gte('start_time', now.toISOString()) // Don't send for past ones

            if (aptError) {
                console.error(`Error fetching appointments for ${inst.company_name}:`, aptError)
                continue
            }

            for (const apt of appointments) {
                try {
                    const pat = apt.patient as any
                    const doc = apt.doctor as any

                    if (!pat?.phone) continue

                    const dateStr = new Date(apt.start_time).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).replace(', ', ' às ')

                    const patientName = (pat.name || 'Paciente').trim()
                    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://inoovazap.com.br'

                    const message = `Olá, *${patientName}*! 👋\n\nEste é um lembrete da sua consulta na *${inst.company_name}*.\n\n🩺 *Profissional:* Dr(a). ${doc.name}\n📅 *Data:* ${dateStr}\n\nPara garantir seu horário, pedimos a gentileza de confirmar sua presença clicando no link abaixo:\n\n🔗 ${frontendUrl}/confirmation/${apt.id}\n\nSua confirmação é muito importante para nós!\nAtenciosamente, equipe *${inst.company_name}* 💚`

                    const jid = `${pat.phone.replace(/\D/g, '')}@s.whatsapp.net`

                    await callPastoriniApi(`/api/instances/${inst.pastorini_id}/send-text`, 'POST', pastoriniApiKey, {
                        jid,
                        text: message
                    })

                    // Mark as sent
                    await supabase
                        .from('appointments')
                        .update({ reminder_sent_at: new Date().toISOString() })
                        .eq('id', apt.id)

                    totalSent++
                    console.log(`Reminder sent for appointment ${apt.id}`)
                } catch (e) {
                    console.error(`Failed to send reminder for ${apt.id}:`, e)
                }
            }
        }

        return new Response(JSON.stringify({ success: true, totalSent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Task error:', error)
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
