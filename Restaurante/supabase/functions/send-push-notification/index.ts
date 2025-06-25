import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body, targetRole, data } = await req.json()

    console.log('Recibida petición de notificación:', { title, body, targetRole, data })

    // Inicializar cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener tokens directamente de la tabla user_push_tokens
    // Esto es más simple y no depende del nombre de tu tabla de usuarios
    const { data: tokensData, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('token, platform, user_id')
      .not('token', 'is', null)

    if (tokensError) {
      console.error('Error obteniendo tokens:', tokensError)
      throw tokensError
    }

    if (!tokensData || tokensData.length === 0) {
      console.log('No se encontraron tokens de push notifications')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay tokens registrados para enviar notificaciones',
          sentCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Extraer todos los tokens únicos
    const tokens: string[] = []
    tokensData.forEach(tokenObj => {
      if (tokenObj.token && !tokens.includes(tokenObj.token)) {
        tokens.push(tokenObj.token)
      }
    })

    if (tokens.length === 0) {
      console.log('No se encontraron tokens válidos')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay tokens válidos para enviar notificaciones',
          sentCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`Enviando notificación a ${tokens.length} dispositivos`)

    // Usar FCM Legacy API (más simple que el v1)
    const fcmPayload = {
      registration_ids: tokens,
      notification: {
        title: title,
        body: body,
        sound: 'default',
        icon: 'ic_notification',
        color: '#3880ff'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      priority: 'high',
      content_available: true
    }

    // Enviar a FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload)
    })

    const fcmResult = await fcmResponse.json()
    
    console.log('Respuesta de FCM:', fcmResult)

    // Analizar resultados
    let successCount = 0
    let failureCount = 0

    if (fcmResult.results) {
      fcmResult.results.forEach((result: any) => {
        if (result.message_id) {
          successCount++
        } else {
          failureCount++
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Notificación enviada exitosamente`,
        sentCount: successCount,
        failedCount: failureCount,
        totalTokens: tokens.length,
        fcmResponse: fcmResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error en función de notificaciones:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})