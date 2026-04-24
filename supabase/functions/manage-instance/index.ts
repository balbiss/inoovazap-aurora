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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const body = await req.json()
    const { action, instance_id, instance_name, ai_config, schedule_config, agent_name, phone, message, appointment_id } = body

    console.log('Action:', action)

    // ========== PUBLIC ACTIONS (No Auth Required) ==========
    if (action === 'send_public_confirmation') {
      if (!appointment_id) {
        return new Response(JSON.stringify({ error: 'appointment_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
        return new Response(JSON.stringify({ error: 'Incomplete data for notification' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Format date
      const date = new Date(appointment.start_time).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const confirmationMessage = `Olá *${pat.name}*!\n\nSeu agendamento de *${aptType}* (${ins}) na *${inst.company_name}* com o(a) Dr(a). *${doc.name}* foi confirmado para o dia *${date}*.\n\nObrigado por utilizar nosso serviço!`

      const jid = `${pat.phone.replace(/\D/g, '')}@s.whatsapp.net`

      console.log(`Sending public confirmation for appointment ${appointment_id} to ${jid}`)

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
        return new Response(JSON.stringify({ error: 'instance_id, phone and message are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    // ========== CREATE INSTANCE ==========
    if (action === 'create') {
      const pastoriniId = `inst_${user.id.slice(0, 8)}_${Date.now()}`
      const instanceLabel = instance_name || 'Principal'

      console.log('Creating instance with ID:', pastoriniId, 'Label:', instanceLabel)

      // Busca o nome da clínica do profile do usuário
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .single()

      const clinicName = profile?.company_name || 'Minha Clínica'

      // Create instance in Pastorini
      const pastoriniData = await callPastoriniApi('/api/instances', 'POST', { id: pastoriniId })
      console.log('Pastorini create response:', pastoriniData)

      // Save instance to Supabase com company_name da clínica e instance_name separado
      const { data: instance, error: dbError } = await supabaseClient
        .from('instances')
        .insert({
          user_id: user.id,
          pastorini_id: pastoriniId,
          company_name: clinicName,
          instance_name: instanceLabel,
          pastorini_status: 'created',
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Try to clean up Pastorini instance
        try {
          await callPastoriniApi(`/api/instances/${pastoriniId}`, 'DELETE')
        } catch (e) {
          console.error('Failed to cleanup Pastorini instance:', e)
        }
        throw new Error(dbError.message)
      }

      // Get QR Code
      let qrCode = null
      try {
        const qrData = await callPastoriniApi(`/api/instances/${pastoriniId}/qr`, 'GET')
        qrCode = qrData.qrImage || qrData.qr || qrData.qrCode
      } catch (e) {
        console.log('QR not ready yet:', e)
      }

      return new Response(
        JSON.stringify({ success: true, instance, qrCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== GET INSTANCES ==========
    if (action === 'get_instances') {
      const { data: instances, error } = await supabaseClient
        .from('instances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        throw new Error(error.message)
      }

      // Update status from Pastorini for each instance
      const updatedInstances = await Promise.all(
        (instances || []).map(async (inst) => {
          try {
            const statusData = await callPastoriniApi(`/api/instances/${inst.pastorini_id}/status`, 'GET')
            if (statusData.status !== inst.pastorini_status) {
              await supabaseClient
                .from('instances')
                .update({ pastorini_status: statusData.status })
                .eq('id', inst.id)
            }
            return { ...inst, pastorini_status: statusData.status, phone_number: statusData.phoneNumber }
          } catch (e) {
            console.log('Failed to get status for instance:', inst.pastorini_id, e)
            return inst
          }
        })
      )

      return new Response(
        JSON.stringify({ success: true, instances: updatedInstances }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== GET STATUS ==========
    if (action === 'status') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const statusData = await callPastoriniApi(`/api/instances/${instance_id}/status`, 'GET')

      // Update status in database
      await supabaseClient
        .from('instances')
        .update({ pastorini_status: statusData.status })
        .eq('pastorini_id', instance_id)
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({ success: true, ...statusData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== GET QR CODE ==========
    if (action === 'get_qr') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const qrData = await callPastoriniApi(`/api/instances/${instance_id}/qr`, 'GET')

      return new Response(
        JSON.stringify({ success: true, qrCode: qrData.qrImage || qrData.qr || qrData.qrCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== DELETE INSTANCE (Full Wiping) ==========
    if (action === 'delete') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Delete from Pastorini
      try {
        await callPastoriniApi(`/api/instances/${instance_id}`, 'DELETE')
      } catch (e) {
        console.log('Error deleting from Pastorini (may not exist):', e)
      }

      // Delete from database - WARNING: This triggers ON DELETE CASCADE and wipes all data!
      const { error } = await supabaseClient
        .from('instances')
        .delete()
        .eq('pastorini_id', instance_id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Database error:', error)
        throw new Error(error.message)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== LOGOUT INSTANCE (Keep Data) ==========
    if (action === 'logout') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Delete from Pastorini (this terminates the WhatsApp session)
      try {
        await callPastoriniApi(`/api/instances/${instance_id}`, 'DELETE')
      } catch (e) {
        console.log('Error logout from Pastorini:', e)
      }

      // Update status in database but KEEP the record
      const { error } = await supabaseClient
        .from('instances')
        .update({ pastorini_status: 'disconnected' })
        .eq('pastorini_id', instance_id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Database error:', error)
        throw new Error(error.message)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== UPDATE CONFIG (existing) ==========
    if (action === 'update_config') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Build update object
      const updateData: Record<string, unknown> = {}

      if (ai_config !== undefined) {
        updateData.ai_config = ai_config
      }

      if (schedule_config !== undefined) {
        updateData.schedule_config = schedule_config
      }

      if (agent_name !== undefined) {
        updateData.agent_name = agent_name
      }

      console.log('Updating instance with:', JSON.stringify(updateData))

      // Update the instance (RLS will ensure user owns it)
      const { data, error } = await supabaseClient
        .from('instances')
        .update(updateData)
        .eq('id', instance_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Instance updated successfully:', data?.id)

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== GET CONFIG (existing) ==========
    if (action === 'get_config') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('instances')
        .select('*')
        .eq('id', instance_id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== GET PROFILE PICTURE ==========
    if (action === 'get_profile_picture') {
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'instance_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the phone number from status to build JID
      const statusData = await callPastoriniApi(`/api/instances/${instance_id}/status`, 'GET')

      if (!statusData.phoneNumber) {
        return new Response(
          JSON.stringify({ success: false, profilePictureUrl: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Build JID from phone number
      const jid = `${statusData.phoneNumber}@s.whatsapp.net`

      try {
        const profileData = await callPastoriniApi(`/api/instances/${instance_id}/profile-picture/${jid}`, 'GET')
        return new Response(
          JSON.stringify({
            success: true,
            profilePictureUrl: profileData.url || profileData.profilePictureUrl || profileData.profilePicUrl || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (e) {
        console.log('Error fetching profile picture:', e)
        return new Response(
          JSON.stringify({ success: false, profilePictureUrl: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
