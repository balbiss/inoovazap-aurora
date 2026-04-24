import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PASTORINI_BASE_URL = 'https://zap.inoovaweb.com.br'

async function callPastoriniApi(endpoint: string, method: string, body?: unknown) {
  const apiKey = Deno.env.get('PASTORINI_API_KEY')
  if (!apiKey) {
    throw new Error('PASTORINI_API_KEY not configured')
  }

  const url = `${PASTORINI_BASE_URL}${endpoint}`
  console.log(`Calling Pastorini API: ${method} ${url}`)

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
    console.error('Pastorini API error:', data)
    throw new Error(data.message || `API error: ${response.status}`)
  }

  return data
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const pastoriniKey = Deno.env.get('PASTORINI_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !pastoriniKey) {
      console.error('[ManageInstance] Missing env vars:', { 
        url: !!supabaseUrl, 
        key: !!supabaseServiceKey, 
        pastorini: !!pastoriniKey 
      })
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Servidor mal configurado: Faltam variáveis de ambiente (URL/KEY/PASTORINI)',
        details: { url: !!supabaseUrl, key: !!supabaseServiceKey, pastorini: !!pastoriniKey }
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json().catch(() => ({}))
    console.log('[ManageInstance] Full Request Body:', JSON.stringify(body))
    
    const { action, instance_id, instance_name, ai_config, schedule_config, agent_name, phone, message, appointment_id } = body

    const targetInstanceId = instance_id || body.instanceId // Fallback para camelCase
    console.log(`[ManageInstance] Action: ${action} | TargetInstanceID: ${targetInstanceId}`)

    // ========== PUBLIC ACTIONS (No Auth Required) ==========
    if (action === 'send_public_confirmation') {
      if (!appointment_id) {
        return new Response(JSON.stringify({ success: false, error: 'appointment_id is required' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Use service role key to fetch appointment data (public user can't do this)
      const serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey)

      const { data: appointment, error: aptError } = await serviceRoleClient
        .from('appointments')
        .select(`
          id,
          start_time,
          appointment_type,
          insurance,
          instance:instances!appointments_instance_id_fkey(pastorini_id, company_name),
          doctor:doctors!appointments_doctor_id_fkey(name),
          patient:contacts!appointments_patient_id_fkey(name, phone)
        `)
        .eq('id', appointment_id)
        .single()

      if (aptError || !appointment) {
        console.error('Error fetching appointment for notification:', aptError)
        return new Response(JSON.stringify({ error: 'Appointment not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const inst = appointment.instance as any
      const pat = appointment.patient as any
      const doc = appointment.doctor as any
      const aptType = appointment.appointment_type || 'Consulta'
      const ins = appointment.insurance || 'Particular'

      if (!inst?.pastorini_id || !pat?.phone) {
        return new Response(JSON.stringify({ success: false, error: 'Incomplete data for notification' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Format date/time parts separately
      const aptDate = new Date(appointment.start_time)
      const dayName = aptDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' })
      const dateStr = aptDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
      const timeStr = aptDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
      const firstName = pat.name.split(' ')[0]
      const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1)

      const jid = `${pat.phone.replace(/\D/g, '')}@s.whatsapp.net`
      console.log(`Sending success message for new appointment ${appointment_id} to ${jid}`)

      const confirmationMessage = `Olá *${pat.name}*!\n\nSeu agendamento de *${aptType}* (${ins}) na *${inst.company_name}* com o(a) Dr(a). *${doc.name}* foi realizado com sucesso para o dia *${dateStr}* às *${timeStr}*.\n\nEm breve enviaremos um lembrete para confirmação.\n\nObrigado por utilizar nosso serviço!`

      const result = await callPastoriniApi(`/api/instances/${inst.pastorini_id}/send-text`, 'POST', {
        jid,
        text: confirmationMessage
      })

      return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== PROTECTED ACTIONS (Auth Required) ==========
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token for RLS
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get user ID from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Action:', action, 'User:', user.id, 'Instance:', instance_id)

    // ========== SEND TEXT (Manual) ==========
    if (action === 'send_text') {
      if (!instance_id || !phone || !message) {
        return new Response(JSON.stringify({ success: false, error: 'instance_id, phone and message are required' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { data: inst, error: instError } = await supabaseClient
        .from('instances')
        .select('pastorini_id')
        .eq('id', instance_id)
        .single()

      if (instError || !inst) throw new Error('Instance not found')

      const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`
      const result = await callPastoriniApi(`/api/instances/${inst.pastorini_id}/send-text`, 'POST', {
        jid,
        text: message
      })

      return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    switch (action) {
      case 'create': {
        const pastoriniId = `inst_${user.id.slice(0, 8)}_${Date.now()}`
        const instanceLabel = instance_name || 'Principal'
        console.log('Creating instance:', pastoriniId)

        await callPastoriniApi('/api/instances', 'POST', { id: pastoriniId })

        const { data: instance, error: dbError } = await supabaseClient
          .from('instances')
          .insert({
            user_id: user.id,
            pastorini_id: pastoriniId,
            company_name: 'Minha Clínica',
            instance_name: instanceLabel,
            pastorini_status: 'created',
          })
          .select()
          .single()

        if (dbError) throw new Error(dbError.message)

        return new Response(JSON.stringify({ success: true, instance }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'get_qr': {
        if (!targetInstanceId) throw new Error('instance_id is required for get_qr')
        console.log(`[ManageInstance] Fetching QR for: ${targetInstanceId}`)
        const qrData = await callPastoriniApi(`/api/instances/${targetInstanceId}/qr`, 'GET')
        return new Response(
          JSON.stringify({ 
            success: true, 
            qrCode: qrData.qrImage || qrData.qr || qrData.qrCode 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'status': {
        if (!targetInstanceId) throw new Error('instance_id is required')
        const statusData = await callPastoriniApi(`/api/instances/${targetInstanceId}/status`, 'GET')
        await supabaseClient
          .from('instances')
          .update({ pastorini_status: statusData.status })
          .eq('pastorini_id', targetInstanceId)
        
        return new Response(JSON.stringify({ success: true, ...statusData }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'delete': {
        if (!targetInstanceId) throw new Error('instance_id is required')
        try {
          await callPastoriniApi(`/api/instances/${targetInstanceId}`, 'DELETE')
        } catch (e) {
          console.log('Pastorini delete failed (maybe instance already gone):', e.message)
        }
        await supabaseClient.from('instances').delete().eq('pastorini_id', targetInstanceId)
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'logout': {
        if (!targetInstanceId) throw new Error('instance_id is required')
        try {
          await callPastoriniApi(`/api/instances/${targetInstanceId}/logout`, 'POST')
        } catch (e) {
          console.log('Pastorini logout failed:', e.message)
        }
        await supabaseClient.from('instances')
          .update({ pastorini_status: 'disconnected' })
          .eq('pastorini_id', targetInstanceId)
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'get_instances': {
        const { data: instances, error } = await supabaseClient
          .from('instances')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)

        const updatedInstances = await Promise.all(
          (instances || []).map(async (inst) => {
            try {
              const statusData = await callPastoriniApi(`/api/instances/${inst.pastorini_id}/status`, 'GET')
              return { ...inst, pastorini_status: statusData.status, phone_number: statusData.phoneNumber }
            } catch (e) {
              return inst
            }
          })
        )

        return new Response(JSON.stringify({ success: true, instances: updatedInstances }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'update_config': {
        if (!instance_id) throw new Error('database instance_id is required')
        const updateData: Record<string, unknown> = {}
        if (ai_config !== undefined) updateData.ai_config = ai_config
        if (schedule_config !== undefined) updateData.schedule_config = schedule_config
        if (agent_name !== undefined) updateData.agent_name = agent_name

        const { data, error } = await supabaseClient
          .from('instances')
          .update(updateData)
          .eq('id', instance_id)
          .single()

        if (error) throw new Error(error.message)
        return new Response(JSON.stringify({ success: true, data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'get_config': {
        if (!instance_id) throw new Error('database instance_id is required')
        const { data, error } = await supabaseClient
          .from('instances')
          .select('*')
          .eq('id', instance_id)
          .single()

        if (error) throw new Error(error.message)
        return new Response(JSON.stringify({ success: true, data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'get_profile_picture': {
        if (!targetInstanceId) throw new Error('instance_id is required')
        const statusData = await callPastoriniApi(`/api/instances/${targetInstanceId}/status`, 'GET')
        if (!statusData.phoneNumber) return new Response(JSON.stringify({ success: false, profilePictureUrl: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        const jid = `${statusData.phoneNumber}@s.whatsapp.net`
        try {
          const profileData = await callPastoriniApi(`/api/instances/${targetInstanceId}/profile-picture/${jid}`, 'GET')
          return new Response(JSON.stringify({ success: true, profilePictureUrl: profileData.url || profileData.qrImage || null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (e) {
          return new Response(JSON.stringify({ success: false, profilePictureUrl: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      default:
        console.error(`[ManageInstance] Invalid action received: ${action}`)
        return new Response(
          JSON.stringify({ success: false, error: `Invalid action: ${action}. Body received: ${JSON.stringify(body)}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
